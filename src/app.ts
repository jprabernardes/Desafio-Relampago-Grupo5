// src/app.ts
import express, { Application } from 'express';
import path from 'path';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

/**
 * Configuração e inicialização da aplicação Express.
 */
export const createApp = (): Application => {
  const app = express();

  // Middlewares globais para processamento de JSON e URL encoded
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir arquivos estáticos do frontend (pasta public)
  app.use(express.static(path.join(__dirname, '../public')));

  // Configuração das rotas da API
  app.use('/api', routes);

  // Rota de verificação de saúde (Health Check)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Sistema de Academia funcionando!' });
  });

  // Middleware global de tratamento de erros (Deve ser o último)
  app.use(errorMiddleware);

  return app;
};
