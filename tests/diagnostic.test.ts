// tests/diagnostic.test.ts
// Execute este teste para diagnosticar o problema: npm test -- tests/diagnostic.test.ts

import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env';

describe('🔍 DIAGNÓSTICO - Teste de Configuração', () => {
  
  it('1. Verificar variáveis de ambiente', () => {
    console.log('\n📊 DIAGNÓSTICO DE AMBIENTE:');
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  JWT_SECRET:', process.env.JWT_SECRET);
    console.log('  DB_PATH:', process.env.DB_PATH);
    
    expect(process.env.NODE_ENV).to.equal('test', 'NODE_ENV deve ser "test"');
    expect(process.env.JWT_SECRET).to.exist.and.not.equal('secret_key_change_in_production');
  });

  it('2. Verificar config importado', () => {
    console.log('\n⚙️ CONFIG IMPORTADO:');
    console.log('  nodeEnv:', config.nodeEnv);
    console.log('  jwtSecret:', config.jwtSecret.substring(0, 30) + '...');
    console.log('  dbPath:', config.dbPath);
    
    expect(config.nodeEnv).to.equal('test');
    expect(config.jwtSecret).to.equal('test_secret_key_for_integration_tests');
    expect(config.dbPath).to.equal(':memory:');
  });

  it('3. Testar geração e verificação de JWT', () => {
    const payload = { id: 1, email: 'test@test.com', role: 'admin' };
    
    // Gerar token
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
    console.log('\n🔐 TOKEN GERADO:', token.substring(0, 50) + '...');
    
    // Verificar token
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    console.log('✅ TOKEN VERIFICADO:', decoded);
    
    expect(decoded.id).to.equal(1);
    expect(decoded.email).to.equal('test@test.com');
    expect(decoded.role).to.equal('admin');
  });

  it('4. Testar se JWT_SECRET é consistente', () => {
    const secret1 = config.jwtSecret;
    const secret2 = process.env.JWT_SECRET;
    
    console.log('\n🔑 COMPARAÇÃO DE SECRETS:');
    console.log('  config.jwtSecret:', secret1);
    console.log('  process.env.JWT_SECRET:', secret2);
    console.log('  São iguais?', secret1 === secret2 ? '✅ SIM' : '❌ NÃO');
    
    expect(secret1).to.equal(secret2, 'JWT_SECRET deve ser consistente');
    expect(secret1).to.equal('test_secret_key_for_integration_tests');
  });

  it('5. Verificar AuthService', async () => {
    const { AuthService } = await import('../src/services/AuthService');
    const authService = new AuthService();
    
    // Gerar token de teste
    const testPayload = { id: 999, email: 'diagnose@test.com', role: 'aluno' };
    const testToken = jwt.sign(testPayload, config.jwtSecret, { expiresIn: '1h' });
    
    console.log('\n🧪 TESTE DE AuthService:');
    console.log('  Token gerado externamente:', testToken.substring(0, 50) + '...');
    
    try {
      const verified = authService.verifyToken(testToken);
      console.log('  ✅ AuthService verificou OK:', verified);
      
      expect(verified.id).to.equal(999);
      expect(verified.email).to.equal('diagnose@test.com');
    } catch (error: any) {
      console.log('  ❌ ERRO ao verificar:', error.message);
      throw error;
    }
  });

  it('6. Resumo do diagnóstico', () => {
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMO DO DIAGNÓSTICO');
    console.log('='.repeat(60));
    
    const checks = {
      'NODE_ENV configurado': process.env.NODE_ENV === 'test',
      'JWT_SECRET configurado': process.env.JWT_SECRET === 'test_secret_key_for_integration_tests',
      'DB_PATH configurado': process.env.DB_PATH === ':memory:',
      'Config carregado corretamente': config.jwtSecret === 'test_secret_key_for_integration_tests'
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    });
    
    console.log('='.repeat(60));
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('\n✨ TUDO OK! Seus testes devem funcionar agora.\n');
    } else {
      console.log('\n❌ PROBLEMAS DETECTADOS! Veja o TROUBLESHOOTING.md\n');
    }
    
    expect(allPassed).to.be.true;
  });
});
