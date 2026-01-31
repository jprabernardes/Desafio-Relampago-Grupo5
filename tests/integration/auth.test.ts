import request from 'supertest';
import { expect } from 'chai';
import { createApp } from '../../src/app';
import { initializeDatabase } from '../../src/database/setup';
import { Application } from 'express';

describe('Autenticação', () => {
  let app: Application;

  before(async () => {
    await initializeDatabase();
    app = createApp();
  });

  describe('POST /api/auth/login', () => {

    it('deve logar com credenciais válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@academia.com',
          password: 'admin123'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.be.a('string');
    });

    it('deve falhar com senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@academia.com',
          password: 'senhaerrada'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error');
    });

    it('deve falhar com email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email invalido',
          password: 'admin123'
        });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('deve falhar com email com espaços', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste @email.com',
          password: 'admin123'
        });

      expect(res.status).to.equal(400);
    });

    it('deve falhar com senha vazia', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@academia.com',
          password: ''
        });

      expect(res.status).to.equal(400);
    });

    it('deve falhar com senha muito curta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@academia.com',
          password: '12345'
        });

      expect(res.status).to.equal(400);
    });

    it('deve falhar com senha com espaços', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@academia.com',
          password: 'admin 123'
        });

      expect(res.status).to.equal(400);
    });

    it('deve falhar sem email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'admin123'
        });

      expect(res.status).to.equal(400);
    });

    it('deve falhar sem senha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@academia.com'
        });

      expect(res.status).to.equal(400);
    });

    it('deve falhar com usuário inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@email.com',
          password: 'senha123'
        });

      expect(res.status).to.equal(401);
    });

  });
});
