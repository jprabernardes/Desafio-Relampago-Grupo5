import axios from 'axios';
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
      // Verifica se já existe (simplificado pelo nome)
      // O repo não expõe findByName direto facilmente sem instanciar service ou usar query custom, 
      // mas user service tem lógica de duplicata. Vamos tentar criar e ignorar erro ou usar repo.
      // O ExerciseService tem validação. Vamos usar Repository direto para ser mais rápido/flexível.
      // SQL insert vai falhar se tiver constraints, mas aqui não tem unique no nome no schema (só validação no service).
      // Melhor verificar antes pro log ficar limpo.
      // Como não temos acesso fácil ao "findByName" aqui sem importar service, vamos assumir criação.
      // Mas espere, ExerciseService tem findByName logic. Vamos usar o service methods se possivel?
      // O service joga erro. Vamos usar o repository create e catch error se for o caso, MAS o schema não tem unique constraint no name,
      // a validação está no service. Se usarmos repo direto, pode duplicar.
      // Vamos checar todos os exercícios antes.
      const allExercises = await exerciseRepository.findAll();
      const exists = allExercises.some(e => e.name.toLowerCase() === ex.name.toLowerCase());

      if (!exists) {
        await exerciseRepository.create(ex as Exercise);
        console.log(`  + Exercício criado: ${ex.name}`);
      } else {
        // console.log(`  . Exercício já existe: ${ex.name}`);
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

  // Idempotency check: check if we have many enrollments
  // Count enrollments is not directly exposed in repo, but we can check if a sample class is full or check checks.
  // Checking directly counts via SQL would be ideal but relying on repo:
  const classes = await gymClassRepository.findAll();
  const allUsers = await userService.findAll();
  const students = allUsers.filter((u: any) => u.role === 'aluno');

  if (classes.length === 0 || students.length === 0) return;

  // Simple check: check first class enrollments
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

  // Idempotency check
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

  // Pegar treinos existentes para vincular (opcional, pode ser null, mas vamos tentar vincular)
  // Para simplificar, vamos vincular treinos aleatórios que o aluno TENHA, ou null.

  let checkInCount = 0;
  const today = new Date();

  // Idempotency: check total checkins
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
      // Pula se frequência aleatória não bater, EXCETO se for o João com freq 6 (vai passar quase sempre)
      // Usar Math.random() > (freq/7) significa:
      // freq=1 -> 1/7 (~14%) chance de checkin? NÃO!
      // Math.random() (0..1) > (1/7 = 0.14) -> 86% das vezes é TRUE (continue/pula) -> 14% de chance de TER checkin.
      // Math.random() > (6/7 = 0.85) -> 15% das vezes é TRUE (pula) -> 85% chance de TER checkin.
      // A logica está correta para "frequency days a week".
      if (Math.random() > (frequency / 7)) continue;

      const date = new Date(today);
      date.setDate(today.getDate() - d);

      const dateStr = date.toISOString().split('T')[0];
      const timeStr = `${10 + Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`; // entre 10h e 20h
      // Checkin at needs full ISO string usually or whatever DB expects. 
      // setup.ts says: checkin_at TEXT DEFAULT CURRENT_TIMESTAMP.
      // CheckInRepository uses provided string.
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

    // Verificar quantos usuários já existem (mantendo lógica original)
    try {
      const existingUsers = await userService.findAll();
      console.log(`\nUsuários existentes no banco: ${existingUsers.length}`);
    } catch (e) {
      console.log('Não foi possível verificar usuários existentes');
    }

    // 1. Busca usuários aleatórios da API (Mantido do original, mas encapsulado melhor se quisesse, vou manter inline pra não quebrar muito)
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
