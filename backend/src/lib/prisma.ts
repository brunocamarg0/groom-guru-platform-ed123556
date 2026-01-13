import { PrismaClient } from '@prisma/client';

console.log('🔧 Inicializando Prisma Client...');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Conectar ao banco de dados de forma assíncrona (não bloquear)
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma Client conectado ao banco de dados');
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    console.error('⚠️  Continuando sem conexão ao banco (health check ainda funcionará)');
    
    // Diagnóstico específico por tipo de erro
    if (error.message?.includes('Tenant or user not found')) {
      console.error('🔍 ERRO: Formato de usuário incorreto na DATABASE_URL');
      console.error('🔍 Use: postgres.PROJECT_REF (com ponto entre postgres e project_ref)');
      console.error('🔍 Exemplo: postgresql://postgres.zozmkzcuulgwjbbpgple:SENHA@...');
    } else if (error.message?.includes("Can't reach database server")) {
      console.error('🔍 ERRO: Não consegue alcançar o servidor');
      console.error('🔍 Use Connection Pooling (porta 6543, não 5432)');
      console.error('🔍 Host deve ser: aws-0-REGION.pooler.supabase.com');
    } else {
      console.error('🔍 Verifique se DATABASE_URL está configurada corretamente no Railway');
      console.error('🔍 Verifique se o Supabase está ativo (não pausado)');
    }
    
    console.error('🔍 DATABASE_URL atual:', process.env.DATABASE_URL ? 'Configurada (oculta)' : 'NÃO CONFIGURADA');
    // Não encerrar o processo, apenas logar
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;





