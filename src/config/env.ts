// src/config/env.ts
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

export const config = {
  port: process.env.PORT || 3000, // Porta do servidor
  jwtSecret: process.env.JWT_SECRET || 'secret_key_change_in_production', // Chave secreta para JWT
  dbPath: process.env.DB_PATH || './academia.db', // Caminho do banco de dados SQLite
  nodeEnv: process.env.NODE_ENV || 'development' // Ambiente de execução
};
