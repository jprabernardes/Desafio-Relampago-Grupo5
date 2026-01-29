import axios from 'axios';
import { UserService } from '../services/UserService';

const userService = new UserService();

/**
 * Função auxiliar para limpar nome e criar email válido
 * Remove espaços, acentos e caracteres especiais
 */
function createValidEmail(firstName: string, lastName: string, index: number): string {
  // Remove espaços e converte para lowercase
  const cleanFirst = firstName
    .toLowerCase()
    .replace(/\s+/g, '')  // Remove todos os espaços
    .normalize('NFD')     // Normaliza acentos
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  
  const cleanLast = lastName
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return `${cleanFirst}.${cleanLast}${index}@academia.com`;
}

export async function runSeed() {
  try {
    console.log('='.repeat(50));
    console.log('--- Iniciando Geração de Dados ---');
    console.log('='.repeat(50));

    // Verificar quantos usuários já existem
    try {
      const existingUsers = await userService.findAll();
      console.log(`\nUsuários existentes no banco: ${existingUsers.length}`);
      console.log(`  - Alunos: ${existingUsers.filter((u: any) => u.role === 'aluno').length}`);
      console.log(`  - Instrutores: ${existingUsers.filter((u: any) => u.role === 'instrutor').length}`);
      console.log(`  - Recepcionistas: ${existingUsers.filter((u: any) => u.role === 'recepcionista').length}`);
    } catch (e) {
      console.log('Não foi possível verificar usuários existentes');
    }

    // 1. Busca 300 usuários aleatórios brasileiros da API
    console.log('\nBuscando nomes e emails reais da API...');
    const response = await axios.get('https://randomuser.me/api/?results=300&nat=br');
    const randomUsers = response.data.results;
    console.log(`✓ ${randomUsers.length} nomes obtidos com sucesso!\n`);

    const roles = ['aluno', 'recepcionista', 'instrutor'];
    let userIndex = 0;

    for (const role of roles) {
      console.log(`\nCriando 100 usuários do tipo: ${role}...`);
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < 100; i++) {
        const userData = randomUsers[userIndex];
        const firstName = userData.name.first;
        const lastName = userData.name.last;
        
        // Gerar um CPF fictício único baseado no índice para evitar erro de duplicata
        const fakeDocument = (userIndex + 10000000000).toString(); 

        try {
          const newUser = {
            name: `${firstName} ${lastName}`, // Nome pode ter espaço
            email: createValidEmail(firstName, lastName, userIndex), // Email SEM espaço
            password: 'senha123',
            document: fakeDocument,
            role: role as any,
          };
          
          await userService.create(
            newUser,
            'administrador', // creatorRole correto
            role === 'aluno' ? 'mensal' : undefined
          );
          
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`  ${successCount} ${role}s criados...`);
          }
        } catch (err: any) {
          errorCount++;
          console.error(`  Erro ao criar ${role} ${userIndex}: ${err.message}`);
          // Pula se der erro de email/cpf já existente
          continue;
        }
        
        userIndex++;
      }
      
      console.log(`✓ ${role}: ${successCount} criados, ${errorCount} erros`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('--- Seed finalizado com sucesso! ---');
    console.log('='.repeat(50));
    
    // Verificar total final
    try {
      const finalUsers = await userService.findAll();
      console.log(`\nTotal de usuários no banco agora: ${finalUsers.length}`);
      console.log(`  - Alunos: ${finalUsers.filter((u: any) => u.role === 'aluno').length}`);
      console.log(`  - Instrutores: ${finalUsers.filter((u: any) => u.role === 'instrutor').length}`);
      console.log(`  - Recepcionistas: ${finalUsers.filter((u: any) => u.role === 'recepcionista').length}`);
      console.log(`  - Admins: ${finalUsers.filter((u: any) => u.role === 'administrador').length}`);
    } catch (e) {
      console.log('Não foi possível verificar total final');
    }
    
    console.log('\n✓ Processo concluído!\n');
  } catch (error) {
    console.error('\n✗ Erro ao rodar seed:', error);
    process.exit(1);
  }
}

export default runSeed;
