// src/app.ts
import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import routes from './routes';
import cookieParser from 'cookie-parser';
import { config } from './config/env';

import { errorMiddleware } from './middlewares/error.middleware';
import { generalRateLimiter } from './middlewares/rateLimit.middleware';

/**
 * Configuração e inicialização da aplicação Express.
 */
export const createApp = (): Application => {
  const app = express();


  // Configuração CORS
  app.set('trust proxy', true);
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

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

  if (config.appBasePath) {
    app.use((req, res, next) => {

      const basePath = config.appBasePath.startsWith('/') 
        ? config.appBasePath.replace(/\/$/, '')
        : `/${config.appBasePath.replace(/\/$/, '')}`;
      
      const originalPath = (req.originalUrl || req.url || req.path).split('?')[0];
      const requestPath = originalPath.replace(/\/$/, ''); 
      
      const basePathNoSlash = basePath.replace(/^\//, '');
      const matchesBasePath = requestPath === basePath || 
                              requestPath === basePathNoSlash ||
                              requestPath === `/${basePathNoSlash}`;
      
      if (matchesBasePath && !originalPath.endsWith('/')) {
        return res.redirect(301, `${basePath}/`);
      }
      
      next();
    });
  }

  // IMPORTANTE: Configuração de ambiente para o frontend 
  // Rota para nginx proxy (sem prefixo)
  app.get('/config.js', (req, res) => {
    res.type('application/javascript');
    res.send(`window.__APP_CONFIG__ = ${JSON.stringify({ APP_BASE_PATH: config.appBasePath, API_BASE_URL: config.apiBaseUrl })};`);
  });
  // Esta rota DEVE vir ANTES do express.static para não ser sobrescrita
  app.get(`${config.appBasePath}/config.js`, (req, res) => {
    res.type('application/javascript');
    res.send(
      `window.__APP_CONFIG__ = ${JSON.stringify({
        APP_BASE_PATH: config.appBasePath,
        API_BASE_URL: config.apiBaseUrl
      })};`
    );
  });

  // Servir arquivos estáticos do frontend (pasta public)
  app.use(config.appBasePath, express.static(path.join(__dirname, '../public')));

  // Configuração das rotas da API
  // Suporta tanto /api quanto /server10/api baseado no APP_BASE_PATH
  const apiPath = `${config.appBasePath}/api`;
  
  // Rate limiting para a API com prefixo correto
  app.use(apiPath, generalRateLimiter);
  
  // Rotas da API
  app.use(apiPath, routes);

  // Rota de verificação de saúde (Health Check)
  app.get(`${apiPath}/health`, (req, res) => {
    res.status(200).json({
      status: 'OK',
      message: 'Sistema de Academia funcionando!',
      config: {
        appBasePath: config.appBasePath,
        apiBaseUrl: config.apiBaseUrl,
        apiPath: apiPath,
        nodeEnv: config.nodeEnv
      }
    });
  });

  // Middleware global de tratamento de erros (Deve ser o último)
  app.use(errorMiddleware);

  return app;
};
