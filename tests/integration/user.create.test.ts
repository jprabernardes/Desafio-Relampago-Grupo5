import request from 'supertest';
import { expect } from 'chai';
import { createApp } from '../../src/app';
import { initializeDatabase } from '../../src/database/setup';
import { Application } from 'express';

describe('Cadastro de Usuário', () => {
  let app: Application;
  let adminToken: string;

  before(async () => {
    await initializeDatabase();
    app = createApp();

    // Fazer login como admin para obter token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@academia.com',
        password: 'admin123'
      });

    adminToken = loginRes.body.token;
  });

  describe('POST /api/users - Criação válida', () => {

    it('admin deve criar aluno com plano mensal', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'aluno@email.com',
          password: 'senha123',
          document: '12345678901',
          role: 'aluno',
          planType: 'mensal'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.not.have.property('password');
      expect(res.body.name).to.equal('Aluno Teste');
      expect(res.body.email).to.equal('aluno@email.com');
      expect(res.body.role).to.equal('aluno');
    });

    it('admin deve criar aluno com plano anual', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Anual',
          email: 'alunoano@email.com',
          password: 'senha123',
          document: '98765432109',
          role: 'aluno',
          planType: 'anual'
        });

      expect(res.status).to.equal(201);
      expect(res.body.planType).to.equal('anual');
    });

  });

  describe('POST /api/users - Validação de CPF', () => {

    it('não deve permitir CPF com letras', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste2@email.com',
          password: 'senha123',
          document: '123abc45678',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('não deve permitir CPF com menos de 11 dígitos', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste3@email.com',
          password: 'senha123',
          document: '123456789',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir CPF com mais de 11 dígitos', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste4@email.com',
          password: 'senha123',
          document: '123456789012',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir CPF vazio', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste5@email.com',
          password: 'senha123',
          document: '',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir CPF com caracteres especiais', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste6@email.com',
          password: 'senha123',
          document: '123.456.789-01',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

  });

  describe('POST /api/users - Validação de Email', () => {

    it('não deve permitir email inválido', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'emailinvalido',
          password: 'senha123',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir email com espaço', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste @email.com',
          password: 'senha123',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir email duplicado', async () => {
      // Primeiro cadastro
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Usuario 1',
          email: 'duplicado@email.com',
          password: 'senha123',
          document: '11111111111',
          role: 'aluno'
        });

      // Tentativa de duplicar
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Usuario 2',
          email: 'duplicado@email.com',
          password: 'senha123',
          document: '22222222222',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

  });

  describe('POST /api/users - Validação de Senha', () => {

    it('não deve permitir senha com menos de 6 caracteres', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste7@email.com',
          password: '12345',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir senha com espaços', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste8@email.com',
          password: 'senha 123',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir senha vazia', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste9@email.com',
          password: '',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

  });

  describe('POST /api/users - Validação de Campos Obrigatórios', () => {

    it('não deve permitir criar usuário sem nome', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'teste10@email.com',
          password: 'senha123',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(400);
    });

    it('não deve permitir criar usuário sem role', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Aluno Teste',
          email: 'teste11@email.com',
          password: 'senha123',
          document: '12345678901'
        });

      expect(res.status).to.equal(400);
    });

  });

  describe('POST /api/users - Autorização', () => {

    it('não deve permitir criar usuário sem token', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Aluno Teste',
          email: 'teste12@email.com',
          password: 'senha123',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(401);
    });

    it('não deve permitir criar usuário com token inválido', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', 'Bearer tokeninvalido')
        .send({
          name: 'Aluno Teste',
          email: 'teste13@email.com',
          password: 'senha123',
          document: '12345678901',
          role: 'aluno'
        });

      expect(res.status).to.equal(401);
    });

  });
});
