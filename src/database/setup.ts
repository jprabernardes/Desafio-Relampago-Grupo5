// src/database/setup.ts
import db from './db';
import bcrypt from 'bcrypt';

/**
 * Creates all necessary tables in the database.
 */
export const createTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('administrador', 'recepcionista', 'instrutor', 'aluno')) NOT NULL,
          document TEXT UNIQUE NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS training (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          instructor_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          finish INTEGER NOT NULL DEFAULT 0,
          completed_date TEXT,
          FOREIGN KEY (instructor_id) REFERENCES users(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS exercise (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          repetitions INTEGER NOT NULL,
          weight INTEGER NOT NULL,
          series INTEGER NOT NULL
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS exercise_training (
          exercise_id INTEGER NOT NULL,
          training_id INTEGER NOT NULL,
          PRIMARY KEY (exercise_id, training_id),
          FOREIGN KEY (exercise_id) REFERENCES exercise(id),
          FOREIGN KEY (training_id) REFERENCES training(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS training_user (
          training_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          PRIMARY KEY (training_id, user_id),
          FOREIGN KEY (training_id) REFERENCES training(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Group classes table
      db.run(`
        CREATE TABLE IF NOT EXISTS gym_class (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          slots_limit INTEGER NOT NULL,
          instructor_id INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (instructor_id) REFERENCES users(id)
        )
      `);

      // Enrollments table
      db.run(`
        CREATE TABLE IF NOT EXISTS enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          gym_class_id INTEGER NOT NULL,
          enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id),
          FOREIGN KEY (gym_class_id) REFERENCES gym_class(id),
          UNIQUE(student_id, gym_class_id)
        )
      `);

      // Check-ins table
      db.run(`
        CREATE TABLE IF NOT EXISTS checkins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          training_id INTEGER,
          checkin_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id),
          FOREIGN KEY (training_id) REFERENCES training(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Tables created successfully.');
          resolve();
        }
      });
    });
  });
};

/**
 * Creates default admin user if it doesn't exist.
 */
export const createDefaultUsers = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Default users list
      const defaultUsers = [
        {
          name: 'Administrador',
          email: 'admin@academia.com',
          password: 'admin123',
          role: 'administrador',
          document: '00000000000',
        },
        {
          name: 'Recepcionista',
          email: 'maria@academia.com',
          password: 'senha123',
          role: 'recepcionista',
          document: '11111111111',
        },
        {
          name: 'Instrutor',
          email: 'carlos@academia.com',
          password: 'senha123',
          role: 'instrutor',
          document: '22222222222',
        },
        {
          name: 'Aluno',
          email: 'joao@academia.com',
          password: 'senha123',
          role: 'aluno',
          document: '33333333333',
        },
      ];

      for (const user of defaultUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await new Promise<void>((res, rej) => {
          db.run(
            `
            INSERT OR IGNORE INTO users (name, email, password, role, document)
            VALUES (?, ?, ?, ?, ?)
          `,
            [user.name, user.email, hashedPassword, user.role, user.document],
            (err) => {
              if (err) {
                rej(err);
              } else {
                console.log(`✅ Usuário ${user.role} verificado/criado (email: ${user.email}, senha: ${user.password})`);
                res();
              }
            }
          );
        });
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};


/**
 * Initializes the database connection and sets up the initial schema.
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await createTables();
    await createDefaultUsers();
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};
