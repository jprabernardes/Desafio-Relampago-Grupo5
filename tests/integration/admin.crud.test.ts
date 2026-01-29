import request from 'supertest';
import { expect } from 'chai';
import { createApp } from '../../src/app';
import { initializeDatabase } from '../../src/database/setup';
import { Application } from 'express';

describe('CRUD de Admin - Gerenciamento de Usuários', () => {
  let app: Application;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;

  before(async () => {
    await initializeDatabase();
    app = createApp();

    // Login como admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@academia.com',
        password: 'admin123'
      });

    adminToken = adminLogin.body.token;

    // Criar um usuário comum para testes
    const createUser = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Usuario Teste',
        email: 'usuario@email.com',
        password: 'senha123',
        document: '99999999999',
        role: 'aluno'
      });

    testUserId = createUser.body.id;

    // Login como usuário comum
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'usuario@email.com',
        password: 'senha123'
      });

    userToken = userLogin.body.token;
  });

  describe('GET /api/users - Listar Usuários', () => {

    it('admin deve listar todos os usuários', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.greaterThan(0);
      expect(res.body[0]).to.not.have.property('password');
    });

    it('usuário comum não deve listar todos os usuários', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(403);
    });

    it('não deve listar usuários sem autenticação', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.status).to.equal(401);
    });

  });

  describe('GET /api/users/:id - Buscar Usuário por ID', () => {

    it('admin deve buscar usuário por ID', async () => {
      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', testUserId);
      expect(res.body).to.not.have.property('password');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const res = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
    });

    it('usuário comum não deve buscar outros usuários', async () => {
      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(403);
    });

  });

  describe('PUT /api/users/:id - Atualizar Usuário', () => {

    it('admin deve atualizar dados do usuário', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nome Atualizado',
          email: 'atualizado@email.com'
        });

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal('Nome Atualizado');
      expect(res.body.email).to.equal('atualizado@email.com');
    });

    it('admin deve atualizar plano do usuário', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          planType: 'anual'
        });

      expect(res.status).to.equal(200);
      expect(res.body.planType).to.equal('anual');
    });

    it('não deve atualizar com email inválido', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'email invalido'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve atualizar com CPF inválido', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          document: '123abc'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve atualizar senha com menos de 6 caracteres', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: '12345'
        });

      expect(res.status).to.equal(400);
    });

    it('usuário comum não deve atualizar outros usuários', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Tentativa'
        });

      expect(res.status).to.equal(403);
    });

    it('deve retornar 404 ao tentar atualizar usuário inexistente', async () => {
      const res = await request(app)
        .put('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Teste'
        });

      expect(res.status).to.equal(404);
    });

  });

  describe('DELETE /api/users/:id - Deletar Usuário', () => {

    it('admin deve deletar usuário', async () => {
      // Criar usuário para deletar
      const createRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Usuario Para Deletar',
          email: 'deletar@email.com',
          password: 'senha123',
          document: '88888888888',
          role: 'aluno'
        });

      const userId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);

      // Verificar que foi deletado
      const checkRes = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRes.status).to.equal(404);
    });

    it('deve retornar 404 ao tentar deletar usuário inexistente', async () => {
      const res = await request(app)
        .delete('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
    });

    it('usuário comum não deve deletar outros usuários', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(403);
    });

    it('não deve deletar sem autenticação', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`);

      expect(res.status).to.equal(401);
    });

  });

  describe('Testes de Permissões Gerais', () => {

    it('admin deve ter acesso a todas as operações', async () => {
      const operations = [
        request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`),
        request(app).get(`/api/users/${testUserId}`).set('Authorization', `Bearer ${adminToken}`),
        request(app).put(`/api/users/${testUserId}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Test' })
      ];

      const results = await Promise.all(operations);

      results.forEach(result => {
        expect(result.status).to.not.equal(403);
      });
    });

    it('usuário comum deve ter acesso negado a operações administrativas', async () => {
      const operations = [
        request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`),
        request(app).get(`/api/users/${testUserId}`).set('Authorization', `Bearer ${userToken}`),
        request(app).put(`/api/users/${testUserId}`).set('Authorization', `Bearer ${userToken}`).send({ name: 'Test' }),
        request(app).delete(`/api/users/${testUserId}`).set('Authorization', `Bearer ${userToken}`)
      ];

      const results = await Promise.all(operations);

      results.forEach(result => {
        expect(result.status).to.equal(403);
      });
    });

  });
});
