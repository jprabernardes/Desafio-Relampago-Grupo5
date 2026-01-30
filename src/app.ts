// src/app.ts
import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import routes from './routes';
import cookieParser from 'cookie-parser';

import { errorMiddleware } from './middlewares/error.middleware';
import { generalRateLimiter } from './middlewares/rateLimit.middleware';

/**
 * Configuração e inicialização da aplicação Express.
 */
export const createApp = (): Application => {
  const app = express();

  // Configuração CORS
  app.use(cors({
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting global para todas as rotas da API
  app.use('/api', generalRateLimiter);

  // Middleware para lidar com cookies
  app.use(cookieParser());

  // Máximo de 10MB para JSON e URL encoded
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Timeout de requisições (30 segundos)
  app.use((req, res, next) => {
    req.setTimeout(30000, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Tempo de requisição excedido' });
      }
    });
    next();
  });

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
