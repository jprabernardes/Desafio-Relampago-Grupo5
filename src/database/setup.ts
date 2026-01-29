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
          phone TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration check for phone column (for existing databases)
      db.all("PRAGMA table_info(users)", (err, rows: any[]) => {
        if (!err && rows) {
          const hasPhone = rows.some(r => r.name === 'phone');
          if (!hasPhone) {
            db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => {
              if (err) console.error("Error adding phone column:", err);
              else console.log("✅ Phone column added to users table.");
            });
          }
        }
      });

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
          series INTEGER,
          repetitions INTEGER,
          weight REAL,
          PRIMARY KEY (exercise_id, training_id),
          FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
          FOREIGN KEY (training_id) REFERENCES training(id) ON DELETE CASCADE
        )
      `, () => {
        // Migration to add columns if they don't exist
        db.all("PRAGMA table_info(exercise_training)", (err, rows: any[]) => {
          if (!err && rows) {
            const columns = rows.map(r => r.name);
            if (!columns.includes('series')) db.run("ALTER TABLE exercise_training ADD COLUMN series INTEGER");
            if (!columns.includes('repetitions')) db.run("ALTER TABLE exercise_training ADD COLUMN repetitions INTEGER");
            if (!columns.includes('weight')) db.run("ALTER TABLE exercise_training ADD COLUMN weight REAL");
          }
        });
      });

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
 * Creates default exercises with predefined values.
 */
export const createDefaultExercises = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const defaultExercises = [
        {
          name: 'Supino Reto com Barra',
          description: 'Exercício composto para peitoral, com auxílio de tríceps e ombros.',
          weight: 5,
          series: 3,
          repetitions: 10
        },
        {
          name: 'Supino Inclinado com Halteres',
          description: 'Exercício com foco na parte superior do peitoral, exigindo maior estabilização.',
          weight: 5,
          series: 3,
          repetitions: 10
        },
        {
          name: 'Crucifixo em Máquina',
          description: 'Exercício de isolamento para o peitoral com movimento guiado.',
          weight: 5,
          series: 3,
          repetitions: 12
        },
        {
          name: 'Puxada Frontal na Polia',
          description: 'Exercício para dorsais, simulando o movimento da barra fixa.',
          weight: 5,
          series: 3,
          repetitions: 10
        },
        {
          name: 'Remada Baixa na Polia',
          description: 'Exercício que trabalha dorsais, romboides e bíceps.',
          weight: 5,
          series: 3,
          repetitions: 10
        },
        {
          name: 'Agachamento Livre',
          description: 'Exercício composto para membros inferiores, com foco em quadríceps, glúteos e core.',
          weight: 5,
          series: 4,
          repetitions: 8
        },
        {
          name: 'Leg Press 45',
          description: 'Exercício em máquina para membros inferiores, com foco em quadríceps e glúteos.',
          weight: 5,
          series: 3,
          repetitions: 12
        },
        {
          name: 'Cadeira Extensora',
          description: 'Exercício de isolamento para o quadríceps.',
          weight: 5,
          series: 3,
          repetitions: 12
        },
        {
          name: 'Mesa Flexora',
          description: 'Exercício de isolamento para os músculos posteriores da coxa.',
          weight: 5,
          series: 3,
          repetitions: 12
        },
        {
          name: 'Desenvolvimento com Halteres',
          description: 'Exercício para ombros, com foco nas porções anterior e medial do deltoide.',
          weight: 5,
          series: 3,
          repetitions: 10
        },
        {
          name: 'Elevação Lateral',
          description: 'Exercício de isolamento para a porção medial dos ombros.',
          weight: 5,
          series: 3,
          repetitions: 12
        },
        {
          name: 'Rosca Direta com Barra',
          description: 'Exercício clássico para o bíceps braquial.',
          weight: 5,
          series: 3,
          repetitions: 10
        },
        {
          name: 'Tríceps Pulley',
          description: 'Exercício de isolamento para o tríceps em polia alta.',
          weight: 5,
          series: 3,
          repetitions: 12
        },
        {
          name: 'Abdominal Crunch',
          description: 'Exercício básico para o reto abdominal.',
          weight: 5,
          series: 3,
          repetitions: 15
        },
        {
          name: 'Prancha Isométrica',
          description: 'Exercício isométrico para estabilização do core.',
          weight: 5,
          series: 3,
          repetitions: 30
        },
        {
          name: 'Rosca Martelo',
          description: 'Exercício para bíceps e antebraço, trabalhando a porção lateral do braço.',
          weight: 5,
          series: 3,
          repetitions: 12
        },
        {
          name: 'Tríceps Testa',
          description: 'Exercício de isolamento para tríceps realizado deitado com halteres ou barra.',
          weight: 5,
          series: 3,
          repetitions: 10
        },
        {
          name: 'Levantamento Terra',
          description: 'Exercício composto fundamental que trabalha toda a cadeia posterior, glúteos e core.',
          weight: 5,
          series: 4,
          repetitions: 8
        },
        {
          name: 'Panturrilha em Pé',
          description: 'Exercício de isolamento para os músculos da panturrilha (gastrocnêmio e sóleo).',
          weight: 5,
          series: 3,
          repetitions: 15
        },
        {
          name: 'Stiff',
          description: 'Exercício para posterior de coxa e glúteos, realizado com barra ou halteres.',
          weight: 5,
          series: 3,
          repetitions: 10
        }
      ];

      for (const exercise of defaultExercises) {
        await new Promise<void>((res, rej) => {
          // Check if exists first
          db.get('SELECT id FROM exercise WHERE name = ?', [exercise.name], (err, row) => {
            if (err) return rej(err);

            if (row) {
              console.log(`ℹ️  Exercício "${exercise.name}" já existe`);
              res();
            } else {
              db.run(
                `INSERT INTO exercise (name, description, repetitions, weight, series)
                 VALUES (?, ?, ?, ?, ?)`,
                [exercise.name, exercise.description, exercise.repetitions, exercise.weight, exercise.series],
                function (err) {
                  if (err) return rej(err);
                  console.log(`✅ Exercício "${exercise.name}" criado`);
                  res();
                }
              );
            }
          });
        });
      }

      console.log(`✅ ${defaultExercises.length} exercícios padrão processados.`);
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
    await createDefaultExercises();
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};
