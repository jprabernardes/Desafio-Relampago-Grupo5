// src/database/setup.ts
import db from './db';
import bcrypt from 'bcrypt';

/**
 * Cria todas as tabelas necessárias no banco de dados.
 */
export const createTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de usuários
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL,
          role TEXT CHECK(role IN ('administrador', 'recepcionista', 'instrutor', 'aluno')) NOT NULL,
          cpf TEXT UNIQUE NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de treinos
      db.run(`
        CREATE TABLE IF NOT EXISTS trainings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          instructor_id INTEGER NOT NULL,
          training_type TEXT CHECK(training_type IN ('A', 'B', 'C')) NOT NULL,
          exercises TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id),
          FOREIGN KEY (instructor_id) REFERENCES users(id)
        )
      `);

      // Tabela de aulas
      db.run(`
        CREATE TABLE IF NOT EXISTS classes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome_aula TEXT NOT NULL,
          data TEXT NOT NULL,
          hora TEXT NOT NULL,
          limite_vagas INTEGER NOT NULL,
          instrutor_id INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (instrutor_id) REFERENCES users(id)
        )
      `);

      // Tabela de inscrições
      db.run(`
        CREATE TABLE IF NOT EXISTS enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          class_id INTEGER NOT NULL,
          enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id),
          FOREIGN KEY (class_id) REFERENCES classes(id),
          UNIQUE(student_id, class_id)
        )
      `);

      // Tabela de check-ins
      db.run(`
        CREATE TABLE IF NOT EXISTS checkins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          training_id INTEGER,
          checkin_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id),
          FOREIGN KEY (training_id) REFERENCES trainings(id)
        )
      `);

      // Tabela de templates de exercícios
      db.run(`
        CREATE TABLE IF NOT EXISTS exercise_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          series TEXT NOT NULL,
          weight TEXT NOT NULL,
          instructor_id INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (instructor_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Tabelas criadas com sucesso.');
          resolve();
        }
      });
    });
  });
};

/**
 * Cria usuário administrador padrão caso não exista.
 */
export const createDefaultAdmin = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
     // Idealmente, a senha deve ser forte e gerenciada via variáveis de ambiente em produção
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.run(`
      INSERT OR IGNORE INTO users (nome, email, senha, role, cpf)
      VALUES (?, ?, ?, ?, ?)
    `, ['Administrador', 'admin@academia.com', hashedPassword, 'administrador', '00000000000'], (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Usuário administrador verificado/criado (email: admin@academia.com, senha: admin123)');
        resolve();
      }
    });
  });
};

/**
 * Inicializa a conexão com o banco de dados e configura o esquema inicial.
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await createTables();
    await createDefaultAdmin();
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};
