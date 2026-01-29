// src/config/env.ts
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.NODE_ENV === 'test' 
    ? 'test_secret_key_for_integration_tests'
    : (process.env.JWT_SECRET || 'secret_key_change_in_production'),
  dbPath: process.env.NODE_ENV === 'test'
    ? ':memory:'
    : (process.env.DB_PATH || './academia.db'),
  nodeEnv: process.env.NODE_ENV || 'development'
};
