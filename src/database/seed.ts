import axios from 'axios';
import bcrypt from 'bcrypt';
import db from './db';
import { UserService } from '../services/UserService';
import { ExerciseRepository } from '../repositories/ExerciseRepository';
import { GymClassRepository } from '../repositories/GymClassRepository';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { TrainingRepository } from '../repositories/TrainingRepository';
import { Exercise } from '../models/Exercise';

const userService = new UserService();
const exerciseRepository = new ExerciseRepository();
const gymClassRepository = new GymClassRepository();
const enrollmentRepository = new EnrollmentRepository();
const checkInRepository = new CheckInRepository();
const trainingRepository = new TrainingRepository();

/**
 * Cria usuários padrão essenciais (Admin, Recepcionista, Instrutor, Aluno)
 */
export const seedDefaultUsers = async (): Promise<void> => {
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
 * Cria exercícios padrão com valores predefinidos.
 */
export const seedDefaultExercises = async (): Promise<void> => {
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
 * Função auxiliar para limpar nome e criar email válido
 */
function createValidEmail(firstName: string, lastName: string, index: number): string {
  const cleanFirst = firstName
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const cleanLast = lastName
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return `${cleanFirst}.${cleanLast}${index}@academia.com`;
}

/**
 * Seed de Exercícios Extras
 */
async function seedExercises() {
  console.log('\n--- 1. Verificando/Criando Exercícios ---');
  const exercises = [
    { name: 'Supino Reto', description: 'Exercício para peitoral.', repetitions: 10, weight: 20, series: 3 },
    { name: 'Supino Inclinado', description: 'Foco na parte superior do peitoral.', repetitions: 10, weight: 15, series: 3 },
    { name: 'Leg Press 45', description: 'Exercício para pernas.', repetitions: 12, weight: 100, series: 4 },
    { name: 'Cadeira Extensora', description: 'Isolamento de quadríceps.', repetitions: 15, weight: 40, series: 3 },
    { name: 'Puxada Alta', description: 'Costas e bíceps.', repetitions: 12, weight: 45, series: 3 },
    { name: 'Elevação Lateral', description: 'Ombros.', repetitions: 15, weight: 8, series: 3 },
    { name: 'Rosca Scott', description: 'Bíceps isolado.', repetitions: 10, weight: 12, series: 3 },
    { name: 'Tríceps Corda', description: 'Tríceps.', repetitions: 12, weight: 25, series: 3 }
  ];

  for (const ex of exercises) {
    try {
      const allExercises = await exerciseRepository.findAll();
      const exists = allExercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase());

      if (!exists) {
        await exerciseRepository.create(ex as Exercise);
        console.log(`  + Exercício criado: ${ex.name}`);
      } else {
      }
    } catch (e: any) {
      console.error(`  Erro ao criar exercício ${ex.name}:`, e.message);
    }
  }
}

/**
 * Seed de Aulas (Gym Classes)
 */
async function seedClasses() {
  console.log('\n--- 2. Criando Aulas (Yoga, Pilates, Spinning...) ---');

  // Check if classes already exist
  const existingClasses = await gymClassRepository.findAll();
  if (existingClasses.length > 0) {
    console.log('  ! Aulas já existem no banco. Pulando criação.');
    return;
  }

  const classTypes = ['Yoga', 'Pilates', 'Spinning', 'Zumba', 'Crossfit', 'Hidroginástica', 'Boxe'];
  const times = ['07:00', '08:00', '18:00', '19:00', '20:00'];

  // Buscar instrutores
  const allUsers = await userService.findAll();
  let instructores = allUsers.filter((u: any) => u.role === 'instrutor');

  if (instructores.length === 0) {
    console.log('  ! Nenhum instrutor encontrado para criar aulas.');
    return;
  }

  // Garantir que o Carlos esteja na lista (se existir)
  const carlos = instructores.find((u: any) => u.email === 'carlos@academia.com');

  const today = new Date();
  let classesCreated = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    // 3 aulas por dia
    for (let j = 0; j < 3; j++) {
      const type = classTypes[Math.floor(Math.random() * classTypes.length)];
      const time = times[Math.floor(Math.random() * times.length)];

      // 50% chance de ser o Carlos (se ele existir), senão aleatório
      let instructor = instructores[Math.floor(Math.random() * instructores.length)];
      if (carlos && Math.random() > 0.5) {
        instructor = carlos;
      }

      if (!instructor.id) continue;

      const gymClass = {
        name: type,
        date: dateStr,
        time: time,
        slots_limit: 20, // Vagas limitadas
        instructor_id: instructor.id
      };

      try {
        await gymClassRepository.create(gymClass);
        classesCreated++;
      } catch (e) {
        // Ignora erros de validação
      }
    }
  }
  console.log(`  ✓ ${classesCreated} aulas criadas para a próxima semana.`);
}

/**
 * Seed de Matrículas em Aulas
 */
async function seedEnrollments() {
  console.log('\n--- 3. Matriculando Alunos em Aulas ---');

  const classes = await gymClassRepository.findAll();
  const allUsers = await userService.findAll();
  const students = allUsers.filter((u: any) => u.role === 'aluno');

  if (classes.length === 0 || students.length === 0) return;

  if (classes.length > 0) {
    const sample = await enrollmentRepository.findByClassId(classes[0].id!);
    if (sample.length > 0) {
      console.log('  ! Matrículas já parecem existir. Pulando criação.');
      return;
    }
  }

  let enrollmentsCount = 0;

  for (const cls of classes) {
    // Matricular 5 a 15 alunos aleatórios por aula
    const studentsCount = Math.floor(Math.random() * 10) + 5;
    const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
    const selectedStudents = shuffledStudents.slice(0, Math.min(studentsCount, students.length));

    for (const student of selectedStudents) {
      if (!student.id || !cls.id) continue;

      try {
        // Verificar se já existe matrícula pra evitar erro de unique constraint
        const existing = await enrollmentRepository.findByStudentAndClass(student.id, cls.id);
        if (!existing) {
          await enrollmentRepository.create({
            student_id: student.id,
            gym_class_id: cls.id
          });
          enrollmentsCount++;
        }
      } catch (e) {
        // Ignora
      }
    }
  }
  console.log(`  ✓ ${enrollmentsCount} matrículas realizadas.`);
}

/**
 * Seed de Treinos e Exercícios nos Treinos
 */
async function seedTrainings() {
  console.log('\n--- 4. Criando Fichas de Treino ---');
  const allUsers = await userService.findAll();
  const students = allUsers.filter((u: any) => u.role === 'aluno');
  const instructores = allUsers.filter((u: any) => u.role === 'instrutor');
  const exercises = await exerciseRepository.findAll();

  if (students.length === 0 || instructores.length === 0 || exercises.length === 0) return;

  const sampleStudent = students[0];
  if (sampleStudent.id) {
    const existingTrainings = await trainingRepository.findByUserId(sampleStudent.id);
    if (existingTrainings.length > 0) {
      console.log('  ! Treinos já existem. Pulando criação.');
      return;
    }
  }

  let trainingCount = 0;

  // Para 50% dos alunos, criar uma ficha de treino A e B
  const loopLimit = Math.min(students.length, 50); // Fazendo para os primeiros 50 para não demorar demais

  for (let i = 0; i < loopLimit; i++) {
    const student = students[i];
    const instructor = instructores[Math.floor(Math.random() * instructores.length)];

    const routines = ['A', 'B'];

    for (const routine of routines) {
      try {
        if (!instructor.id || !student.id) continue;

        // Criar treino
        const training = await trainingRepository.create({
          instructor_id: instructor.id,
          name: `Treino ${routine} - Hipertrofia`,
          finish: false
        });

        if (!training.id) continue;

        // Associar ao aluno
        await trainingRepository.addUser(training.id, student.id);

        // Adicionar 4-6 exercícios aleatórios
        const exercisesCount = Math.floor(Math.random() * 3) + 4;
        const shuffledExercises = [...exercises].sort(() => 0.5 - Math.random());
        const selectedExercises = shuffledExercises.slice(0, exercisesCount);

        for (const ex of selectedExercises) {
          if (!ex.id) continue;
          await exerciseRepository.addToTraining(training.id, ex.id);
        }
        trainingCount++;
      } catch (e) {
        // Ignore
      }
    }
  }
  console.log(`  ✓ ${trainingCount} fichas de treino criadas.`);
}

/**
 * Seed de Check-ins Históricos
 */
async function seedHistoryCheckIns() {
  console.log('\n--- 5. Gerando Histórico de Check-ins (30 dias) ---');
  const allUsers = await userService.findAll();
  const students = allUsers.filter((u: any) => u.role === 'aluno');

  let checkInCount = 0;
  const today = new Date();

  const totalCheckins = await checkInRepository.countAll();
  let targetStudents = students;

  if (totalCheckins > 100) {
    // Se já tem checkins, verificar se o João tem histórico decente
    const joao = students.find((s: any) => s.email === 'joao@academia.com');
    if (joao && joao.id) {
      const joaoCheckins = await checkInRepository.countByStudentId(joao.id);
      if (joaoCheckins < 10) {
        console.log('  ! Histórico geral populado, mas João tem poucos check-ins. Reparando João...');
        targetStudents = [joao];
      } else {
        console.log('  ! Histórico de check-ins já populado. Pulando.');
        return;
      }
    } else {
      console.log('  ! Histórico de check-ins já populado. Pulando.');
      return;
    }
  }

  // Processar cada aluno com um padrão diferente
  for (const student of targetStudents) {
    if (!student.id) continue;

    let frequency = Math.floor(Math.random() * 5) + 1; // 1 a 5 (padrão)

    // Forçar João a ter alta frequência
    if (student.email === 'joao@academia.com') {
      frequency = 6; // Quase todos os dias
    }

    const userTrainings = await trainingRepository.findByUserId(student.id);

    // Iterar últimos 30 dias
    for (let d = 30; d >= 0; d--) {
      if (Math.random() > (frequency / 7)) continue;

      const date = new Date(today);
      date.setDate(today.getDate() - d);

      const dateStr = date.toISOString().split('T')[0];
      const timeStr = `${10 + Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`; // entre 10h e 20h
      const fullDate = `${dateStr}T${timeStr}:00Z`;

      const trainingId = userTrainings.length > 0
        ? userTrainings[Math.floor(Math.random() * userTrainings.length)].id
        : undefined;

      try {
        await checkInRepository.create({
          student_id: student.id,
          training_id: trainingId,
          checkin_at: fullDate
        });
        checkInCount++;
      } catch (e) {
        // Ignore
      }
    }
  }
  console.log(`  ✓ ${checkInCount} check-ins históricos criados.`);
}


export async function runSeed() {
  try {
    console.log('='.repeat(50));
    console.log('--- Iniciando Geração de Dados (Completa) ---');
    console.log('='.repeat(50));

    // 0. Criar usuários padrão essenciais (Admin, Maria, Carlos, João)
    console.log('\n--- 0. Criando Usuários Padrão Essenciais ---');
    await seedDefaultUsers();

    // 0.1. Criar exercícios padrão
    console.log('\n--- 0.1. Criando Exercícios Padrão ---');
    await seedDefaultExercises();

    // Verificar quantos usuários já existem
    try {
      const existingUsers = await userService.findAll();
      console.log(`\nUsuários existentes no banco: ${existingUsers.length}`);
    } catch (e) {
      console.log('Não foi possível verificar usuários existentes');
    }

    // 1. Busca usuários aleatórios da API 
    console.log('\nBuscando nomes e emails reais da API...');

    // Se já tiver muitos usuários (>10), assume que users já foram seedados e pula essa parte pesada
    const usersCount = (await userService.findAll()).length;
    if (usersCount < 10) {
      try {
        const response = await axios.get('https://randomuser.me/api/?results=300&nat=br');
        const randomUsers = response.data.results;
        console.log(`✓ ${randomUsers.length} nomes obtidos com sucesso!\n`);

        const roles = ['aluno', 'recepcionista', 'instrutor'];
        let userIndex = 0;

        for (const role of roles) {
          console.log(`\nCriando 100 usuários do tipo: ${role}...`);
          let successCount = 0;

          for (let i = 0; i < 100; i++) {
            const userData = randomUsers[userIndex];
            if (!userData) break;

            const firstName = userData.name.first;
            const lastName = userData.name.last;
            const fakeDocument = (userIndex + 10000000000).toString();

            try {
              const newUser = {
                name: `${firstName} ${lastName}`,
                email: createValidEmail(firstName, lastName, userIndex),
                password: 'senha123',
                document: fakeDocument,
                role: role as any,
              };

              await userService.create(
                newUser,
                'administrador',
                role === 'aluno' ? 'mensal' : undefined
              );
              successCount++;
            } catch (err: any) {
              // Pula erros silenciosamente no seed massivo
            }
            userIndex++;
          }
          console.log(`✓ ${role}: ${successCount} criados.`);
        }
      } catch (e) {
        console.error("Erro ao buscar/criar usuários da API:", e);
      }
    } else {
      console.log("  ! Usuários já populados, pulando criação massiva.");
    }

    // Novas etapas do Seed
    await seedExercises();
    await seedClasses();
    await seedEnrollments();
    await seedTrainings();
    await seedHistoryCheckIns();

    console.log('\n' + '='.repeat(50));
    console.log('--- Seed finalizado com sucesso! ---');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n✗ Erro ao rodar seed:', error);
    process.exit(1);
  }
}

export default runSeed;

if (require.main === module) {
  runSeed();
}
