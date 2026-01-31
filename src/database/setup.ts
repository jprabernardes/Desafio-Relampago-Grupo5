// src/database/setup.ts
import db from './db';
import runSeed from './seed';

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

      db.run(`
        CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        description TEXT,
        benefits_json TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT
       )
    `)

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
    plan_type TEXT NOT NULL,
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
 * Verifica se o banco está vazio (primeira criação)
 */
const isDatabaseEmpty = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row: any) => {
      if (err) {
        // Se der erro, assume que está vazio (tabela pode não existir ainda)
        resolve(true);
      } else {
        resolve(row.count === 0);
      }
    });
  });
};

/**
 * Initializes the database connection and sets up the initial schema.
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Garante que as tabelas existam
    await createTables();

    // Verifica se é a primeira criação do banco
    const isEmpty = await isDatabaseEmpty();

    if (isEmpty) {
      console.log('🌱 Banco de dados vazio detectado. Executando seed inicial...');
      await runSeed();
      console.log('✅ Seed inicial concluído!');
    } else {
      console.log('✅ Database initialized successfully!');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};
