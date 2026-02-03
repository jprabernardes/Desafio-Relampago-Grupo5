import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
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

dotenv.config();

/**
 * ✅ Seed de Planos Padrão
 * (PRECISA vir antes de criar alunos que usam planType)
 */
export const seedDefaultPlans = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT OR IGNORE INTO plans (code, name, price_cents, duration_days, description, benefits_json, active)
      VALUES
      ('fit', 'Fit', 12990, 30, 'Plano Fit', '["Musculação"]', 1),
      ('fit_pro', 'Fit Pro', 15990, 30, 'Plano Fit Pro', '["Musculação","Aulas em grupo"]', 1),
      ('fit_diamond', 'Fit Diamond', 21990, 30, 'Plano Fit Diamond', '["Musculação","Aulas","Personal 1x/sem"]', 1)
      `,
      [],
      function (err) {
        if (err) return reject(err);

        console.log('✅ Planos padrão verificados/criados');
        resolve();
      }
    );
  });
};

/**
 * Cria usuários padrão essenciais (Admin, Recepcionista, Instrutor, Aluno)
 */
export const seedDefaultUsers = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Default users list
      const alunoPlanType = process.env.SEED_ALUNO_PLAN_TYPE as 'mensal' | 'trimestral' | 'semestral' | 'anual';
      const defaultUsers = [
        {
          name: process.env.SEED_ADMIN_NAME!,
          email: process.env.SEED_ADMIN_EMAIL!,
          password: process.env.SEED_ADMIN_PASSWORD!,
          role: 'administrador',
          document: process.env.SEED_ADMIN_DOCUMENT!,
        },
        {
          name: process.env.SEED_RECEPCIONISTA_NAME!,
          email: process.env.SEED_RECEPCIONISTA_EMAIL!,
          password: process.env.SEED_RECEPCIONISTA_PASSWORD!,
          role: 'recepcionista',
          document: process.env.SEED_RECEPCIONISTA_DOCUMENT!,
        },
        {
          name: process.env.SEED_INSTRUTOR_NAME!,
          email: process.env.SEED_INSTRUTOR_EMAIL!,
          password: process.env.SEED_INSTRUTOR_PASSWORD!,
          role: 'instrutor',
          document: process.env.SEED_INSTRUTOR_DOCUMENT!,
        },
        {
          name: process.env.SEED_ALUNO_NAME!,
          email: process.env.SEED_ALUNO_EMAIL!,
          password: process.env.SEED_ALUNO_PASSWORD!,
          role: 'aluno',
<<<<<<< HEAD
          document: '33333333333',
          planType: 'fit' as const,
=======
          document: process.env.SEED_ALUNO_DOCUMENT!,
          planType: alunoPlanType,
>>>>>>> main
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
<<<<<<< HEAD
                  console.log(
                    `✅ Usuário ${user.role} criado (email: ${user.email}, senha: ${user.password})`
                  );
=======
                  console.log(`✅ Usuário ${user.role} criado (email: ${user.email})`);
>>>>>>> main
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
          const finalUserId =
            userId ||
            (await new Promise<number>((res, rej) => {
              db.get('SELECT id FROM users WHERE email = ?', [user.email], (err, row: any) => {
                if (err) rej(err);
                else res(row.id);
              });
            }));

          // Criar student_profile se não existir
          await new Promise<void>((res, rej) => {
            db.run(
              `INSERT OR IGNORE INTO student_profile (user_id, plan_type, active)
               VALUES (?, ?, 1)`,
              [finalUserId, (user as any).planType || 'fit'],
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
    { name: 'Tríceps Corda', description: 'Tríceps.', repetitions: 12, weight: 25, series: 3 },
    { name: 'Supino Reto com Barra', description: 'Exercício composto para peitoral, com auxílio de tríceps e ombros.', repetitions: 10, weight: 5, series: 3 },
    { name: 'Supino Inclinado com Halteres', description: 'Exercício com foco na parte superior do peitoral, exigindo maior estabilização.', repetitions: 10, weight: 5, series: 3 },
    { name: 'Crucifixo em Máquina', description: 'Exercício de isolamento para o peitoral com movimento guiado.', repetitions: 12, weight: 5, series: 3 },
    { name: 'Puxada Frontal na Polia', description: 'Exercício para dorsais, simulando o movimento da barra fixa.', repetitions: 10, weight: 5, series: 3 },
    { name: 'Remada Baixa na Polia', description: 'Exercício que trabalha dorsais, romboides e bíceps.', repetitions: 10, weight: 5, series: 3 },
    { name: 'Agachamento Livre', description: 'Exercício composto para membros inferiores, com foco em quadríceps, glúteos e core.', repetitions: 8, weight: 5, series: 4 },
    { name: 'Mesa Flexora', description: 'Exercício de isolamento para os músculos posteriores da coxa.', repetitions: 12, weight: 5, series: 3 },
    { name: 'Desenvolvimento com Halteres', description: 'Exercício para ombros, com foco nas porções anterior e medial do deltoide.', repetitions: 10, weight: 5, series: 3 },
    { name: 'Rosca Direta com Barra', description: 'Exercício clássico para o bíceps braquial.', repetitions: 10, weight: 5, series: 3 },
    { name: 'Tríceps Pulley', description: 'Exercício de isolamento para o tríceps em polia alta.', repetitions: 12, weight: 5, series: 3 },
    { name: 'Abdominal Crunch', description: 'Exercício básico para o reto abdominal.', repetitions: 15, weight: 5, series: 3 },
    { name: 'Prancha Isométrica', description: 'Exercício isométrico para estabilização do core.', repetitions: 30, weight: 5, series: 3 },
    { name: 'Rosca Martelo', description: 'Exercício para bíceps e antebraço, trabalhando a porção lateral do braço.', repetitions: 12, weight: 5, series: 3 },
    { name: 'Tríceps Testa', description: 'Exercício de isolamento para tríceps realizado deitado com halteres ou barra.', repetitions: 10, weight: 5, series: 3 },
    { name: 'Levantamento Terra', description: 'Exercício composto fundamental que trabalha toda a cadeia posterior, glúteos e core.', repetitions: 8, weight: 5, series: 4 },
    { name: 'Panturrilha em Pé', description: 'Exercício de isolamento para os músculos da panturrilha (gastrocnêmio e sóleo).', repetitions: 15, weight: 5, series: 3 },
    { name: 'Stiff', description: 'Exercício para posterior de coxa e glúteos, realizado com barra ou halteres.', repetitions: 10, weight: 5, series: 3 }
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

  // Buscar instrutor padrão
  const allUsers = await userService.findAll();
  const instructores = allUsers.filter((u: any) => u.role === 'instrutor');
  const instructor = instructores.find((u: any) => u.email === process.env.SEED_INSTRUTOR_EMAIL!);

  if (!instructor?.id) {
    console.log('  ! Nenhum instrutor encontrado para criar aulas.');
    return;
  }

  const today = new Date();
  let classesCreated = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Converter para formato DD-MM-YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`; // DD-MM-YYYY

    // 1 aula por dia
    const type = classTypes[Math.floor(Math.random() * classTypes.length)];
    const time = times[Math.floor(Math.random() * times.length)];

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
  const student = students.find((u: any) => u.email === process.env.SEED_ALUNO_EMAIL!);

  if (classes.length === 0 || !student?.id) return;

  if (classes.length > 0) {
    const sample = await enrollmentRepository.findByClassId(classes[0].id!);
    if (sample.length > 0) {
      console.log('  ! Matrículas já parecem existir. Pulando criação.');
      return;
    }
  }

  let enrollmentsCount = 0;

  for (const cls of classes) {
    if (!cls.id) continue;

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

  const targetStudent = students.find((u: any) => u.email === process.env.SEED_ALUNO_EMAIL!);
  const targetInstructor = instructores.find((u: any) => u.email === process.env.SEED_INSTRUTOR_EMAIL!);

  if (!targetStudent?.id || !targetInstructor?.id) return;

  if (targetStudent.id) {
    const existingTrainings = await trainingRepository.findByUserId(targetStudent.id);
    if (existingTrainings.length > 0) {
      console.log('  ! Treinos já existem. Pulando criação.');
      return;
    }
  }

  let trainingCount = 0;

  const routines = ['A', 'B'];

  for (const routine of routines) {
    try {
      // Criar treino
      const training = await trainingRepository.create({
        instructor_id: targetInstructor.id,
        name: `Treino ${routine} - Hipertrofia`,
        finish: false
      });

      if (!training.id) continue;

      // Associar ao aluno
      await trainingRepository.addUser(training.id, targetStudent.id);

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
  console.log(`  ✓ ${trainingCount} fichas de treino criadas.`);
}

/**
 * Seed de Check-ins Históricos
 */
async function seedHistoryCheckIns() {
  console.log('\n--- 5. Gerando Histórico de Check-ins (30 dias) ---');
  const allUsers = await userService.findAll();
  const students = allUsers.filter((u: any) => u.role === 'aluno');
  const student = students.find((u: any) => u.email === process.env.SEED_ALUNO_EMAIL!);

  if (!student?.id) return;

  const existingCheckins = await checkInRepository.countByStudentId(student.id);
  if (existingCheckins > 0) {
    console.log('  ! Histórico de check-ins já populado. Pulando.');
    return;
  }

  let checkInCount = 0;
  const today = new Date();
  const userTrainings = await trainingRepository.findByUserId(student.id);
  const frequency = 5; // frequência fixa para o aluno padrão

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

<<<<<<< HEAD
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
      const timeStr = `${10 + Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, '0')}`; // entre 10h e 20h
      const fullDate = `${dateStr}T${timeStr}:00Z`;

      const trainingId =
        userTrainings.length > 0
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
=======
    try {
      await checkInRepository.create({
        student_id: student.id,
        training_id: trainingId,
        checkin_at: fullDate
      });
      checkInCount++;
    } catch (e) {
      // Ignore
>>>>>>> main
    }
  }
  console.log(`  ✓ ${checkInCount} check-ins históricos criados.`);
}

export async function runSeed() {
  try {
    console.log('='.repeat(50));
    console.log('--- Iniciando Geração de Dados (Completa) ---');
    console.log('='.repeat(50));

    // ✅ 0) CRIAR PLANOS PRIMEIRO
    console.log('\n--- 0. Criando Planos Padrão ---');
    await seedDefaultPlans();

    // 1) Usuários padrão essenciais (Admin, Maria, Carlos, João)
    console.log('\n--- 1. Criando Usuários Padrão Essenciais ---');
    await seedDefaultUsers();

<<<<<<< HEAD
    // 1.1) Criar exercícios padrão
    console.log('\n--- 1.1. Criando Exercícios Padrão ---');
    await seedDefaultExercises();

=======
>>>>>>> main
    // Verificar quantos usuários já existem
    try {
      const existingUsers = await userService.findAll();
      console.log(`\nUsuários existentes no banco: ${existingUsers.length}`);
    } catch (e) {
      console.log('Não foi possível verificar usuários existentes');
    }

<<<<<<< HEAD
    // 2) Busca usuários aleatórios da API
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
                role === 'aluno' ? 'fit' : undefined
              );
              successCount++;
            } catch (err: any) {
              // Pula erros silenciosamente no seed massivo
              // Se quiser debugar alunos, descomenta abaixo:
              // if (role === 'aluno' && i < 3) console.error('ERRO ALUNO:', err?.message || err);
            }
            userIndex++;
          }
          console.log(`✓ ${role}: ${successCount} criados.`);
        }
      } catch (e) {
        console.error('Erro ao buscar/criar usuários da API:', e);
      }
    } else {
      console.log('  ! Usuários já populados, pulando criação massiva.');
    }

    // Etapas do seed (mantive as mesmas)
=======
    // Novas etapas do Seed
>>>>>>> main
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
