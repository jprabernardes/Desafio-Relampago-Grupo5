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
        CREATE TABLE IF NOT EXISTS student_profile (
          user_id INTEGER PRIMARY KEY,
          plan_type TEXT CHECK(plan_type IN ('mensal', 'trimestral', 'semestral', 'anual')) NOT NULL,
          active INTEGER DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);



      db.run(`
        CREATE TABLE IF NOT EXISTS training (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          instructor_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          finish INTEGER NOT NULL DEFAULT 0,
          completed_date TEXT,
          FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
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
          FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
          FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS training_user (
          training_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          PRIMARY KEY (training_id, user_id),
          FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
          FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Enrollments table
      db.run(`
        CREATE TABLE IF NOT EXISTS enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          gym_class_id INTEGER NOT NULL,
          enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (gym_class_id) REFERENCES gym_class(id) ON DELETE CASCADE,
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
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Tables created successfully.');
          resolve();
        }
      });
    });
  });
};

/**
 * Creates default users with proper student_profile for students.
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
          planType: 'mensal' as const,
        },
      ];

      for (const user of defaultUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Inserir ou ignorar usuário
        const userId = await new Promise<number | undefined>((res, rej) => {
          db.run(
            `INSERT OR IGNORE INTO users (name, email, password, role, document)
             VALUES (?, ?, ?, ?, ?)`,
            [user.name, user.email, hashedPassword, user.role, user.document],
            function (err) {
              if (err) {
                rej(err);
              } else {
                if (this.changes > 0) {
                  console.log(`✅ Usuário ${user.role} criado (email: ${user.email}, senha: ${user.password})`);
                  res(this.lastID);
                } else {
                  console.log(`ℹ️  Usuário ${user.role} já existe (email: ${user.email})`);
                  res(undefined);
                }
              }
            }
          );
        });

        // Se é aluno, garantir que student_profile existe
        if (user.role === 'aluno') {
          // Buscar ID do usuário (caso já existisse)
          const finalUserId = userId || await new Promise<number>((res, rej) => {
            db.get(
              'SELECT id FROM users WHERE email = ?',
              [user.email],
              (err, row: any) => {
                if (err) rej(err);
                else res(row.id);
              }
            );
          });

          // Criar student_profile se não existir
          await new Promise<void>((res, rej) => {
            db.run(
              `INSERT OR IGNORE INTO student_profile (user_id, plan_type, active)
               VALUES (?, ?, 1)`,
              [finalUserId, (user as any).planType || 'mensal'],
              function (err) {
                if (err) {
                  rej(err);
                } else {
                  if (this.changes > 0) {
                    console.log(`✅ Student profile criado para user_id ${finalUserId}`);
                  } else {
                    console.log(`ℹ️  Student profile já existe para user_id ${finalUserId}`);
                  }
                  res();
                }
              }
            );
          });
        }
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
