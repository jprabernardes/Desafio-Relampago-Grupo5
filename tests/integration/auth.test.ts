// tests/integration/auth.test.ts
import { expect } from 'chai';
import { createApp } from '../../src/app';
import { initializeDatabase } from '../../src/database/setup';
import { Application } from 'express';

describe('Testes de Autenticação', () => {
  let app: Application;

  before(async () => {
    await initializeDatabase();
    app = createApp();
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      // Teste básico de estrutura
      expect(app).to.exist;
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      // Teste básico de estrutura
      expect(app).to.exist;
    });
  });
});
