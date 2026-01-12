/**
 * Script para configurar banco de dados na nuvem
 * Execute: node scripts/setup-cloud-db.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('☁️  Configuração de Banco de Dados na Nuvem\n');
  console.log('Escolha sua plataforma:');
  console.log('1. Supabase (PostgreSQL) - Recomendado para iniciantes');
  console.log('2. Neon (PostgreSQL) - Mais espaço (3GB)');
  console.log('3. PlanetScale (MySQL) - Mais espaço (5GB)');
  console.log('4. Outro (PostgreSQL) - Você fornece a URL\n');

  const escolha = await question('Digite o número da opção (1-4): ');

  let provider = 'postgresql';
  let databaseUrl = '';

  switch(escolha) {
    case '1':
      console.log('\n📝 Passos para Supabase:');
      console.log('1. Acesse: https://supabase.com');
      console.log('2. Crie um projeto');
      console.log('3. Vá em Settings → Database');
      console.log('4. Copie a Connection string\n');
      databaseUrl = await question('Cole a URL de conexão do Supabase: ');
      break;

    case '2':
      console.log('\n📝 Passos para Neon:');
      console.log('1. Acesse: https://neon.tech');
      console.log('2. Crie um projeto');
      console.log('3. Vá em Connection Details');
      console.log('4. Copie a Connection string\n');
      databaseUrl = await question('Cole a URL de conexão do Neon: ');
      break;

    case '3':
      provider = 'mysql';
      console.log('\n📝 Passos para PlanetScale:');
      console.log('1. Acesse: https://planetscale.com');
      console.log('2. Crie um banco de dados');
      console.log('3. Vá em Connect');
      console.log('4. Copie a Connection string\n');
      databaseUrl = await question('Cole a URL de conexão do PlanetScale: ');
      break;

    case '4':
      console.log('\n📝 Para outros provedores PostgreSQL:');
      databaseUrl = await question('Cole a URL de conexão completa: ');
      break;

    default:
      console.log('❌ Opção inválida!');
      process.exit(1);
  }

  // Atualizar schema.prisma
  console.log('\n🔧 Atualizando schema.prisma...');
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  schemaContent = schemaContent.replace(
    /provider\s*=\s*"sqlite"/,
    `provider = "${provider}"`
  );
  
  fs.writeFileSync(schemaPath, schemaContent);
  console.log('✅ Schema atualizado!\n');

  // Atualizar .env
  console.log('📝 Atualizando .env...');
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    // Substituir DATABASE_URL se existir
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        `DATABASE_URL="${databaseUrl}"`
      );
    } else {
      envContent += `\nDATABASE_URL="${databaseUrl}"\n`;
    }
  } else {
    envContent = `DATABASE_URL="${databaseUrl}"
PORT=3001
FRONTEND_URL=http://localhost:8080
`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env atualizado!\n');

  console.log('📦 Próximos passos:');
  console.log('1. npm run prisma:migrate  (criar tabelas)');
  console.log('2. npm run prisma:generate (gerar cliente)');
  console.log('3. npm run dev (iniciar servidor)\n');

  rl.close();
}

main().catch(console.error);
