import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_integration_tests';
process.env.DB_PATH = ':memory:';

console.log('\n🧪 Ambiente de teste configurado');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET, '\n');
