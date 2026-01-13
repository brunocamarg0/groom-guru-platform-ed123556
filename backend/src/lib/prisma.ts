import { PrismaClient } from '@prisma/client';

console.log('🔧 Inicializando Prisma Client...');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Conectar ao banco de dados de forma assíncrona (não bloquear)
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma Client conectado ao banco de dados');
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    console.error('⚠️  Continuando sem conexão ao banco (health check ainda funcionará)');
    // Não encerrar o processo, apenas logar
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;





