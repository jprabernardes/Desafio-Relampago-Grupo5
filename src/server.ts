// src/server.ts
import { createApp } from './app';
import { initializeDatabase } from './database/setup';
import { config } from './config/env';

/**
 * Ponto de entrada do servidor.
 * Inicializa o banco de dados e inicia o servidor Express.
 */
const startServer = async () => {
  try {
    // Inicializa banco de dados (Cria tabelas e admin padrão)
    await initializeDatabase();

    // Cria aplicação Express configurada
    const app = createApp();

    // Inicia o servidor escutando na porta definida
    app.listen(config.port, () => {
      const baseUrl = `http://localhost:${config.port}${config.appBasePath}`;
      console.log(`\n🚀 Servidor rodando na porta ${config.port}`);
      console.log(`📍 URL Base: ${baseUrl}`);
      console.log(`📍 Verificação de saúde: ${baseUrl}/api/health`);
      console.log(`\n✅ Sistema pronto para uso!\n`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
