// src/database/db.ts
import sqlite3 from 'sqlite3';
import { config } from '../config/env';

// Conexão com SQLite
const db = new sqlite3.Database(config.dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

export default db;
