#!/usr/bin/env tsx
/**
 * Script para configurar migrações do Prisma
 * Tenta aplicar migrações normalmente, e se falhar com P3005 (banco não vazio),
 * faz o baseline das migrações existentes
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const PRISMA_MIGRATE_DEPLOY = 'npx prisma migrate deploy';
const PRISMA_MIGRATE_RESOLVE = 'npx prisma migrate resolve';

async function main() {
  console.log('🔧 [MIGRATIONS] Verificando estado das migrações...');

  try {
    // Tentar aplicar migrações normalmente
    console.log('🔧 [MIGRATIONS] Tentando aplicar migrações...');
    execSync(PRISMA_MIGRATE_DEPLOY, {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('✅ [MIGRATIONS] Migrações aplicadas com sucesso!');
    process.exit(0);
  } catch (error: any) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message || '';
    
    // Verificar se é o erro P3005 (banco não vazio)
    if (errorOutput.includes('P3005') || errorOutput.includes('database schema is not empty')) {
      console.log('⚠️  [MIGRATIONS] Banco já possui tabelas. Fazendo baseline das migrações...');
      
      // Listar todas as migrações na pasta migrations
      const migrationsPath = join(process.cwd(), 'prisma', 'migrations');
      
      if (!existsSync(migrationsPath)) {
        console.error('❌ [MIGRATIONS] Pasta de migrações não encontrada:', migrationsPath);
        process.exit(1);
      }

      // Ler diretórios de migrações
      const fs = require('fs');
      const migrations = fs.readdirSync(migrationsPath)
        .filter((dir: string) => {
          const dirPath = join(migrationsPath, dir);
          return fs.statSync(dirPath).isDirectory() && 
                 fs.existsSync(join(dirPath, 'migration.sql'));
        })
        .sort();

      if (migrations.length === 0) {
        console.error('❌ [MIGRATIONS] Nenhuma migração encontrada!');
        process.exit(1);
      }

      console.log(`📋 [MIGRATIONS] Encontradas ${migrations.length} migrações para fazer baseline:`);
      
      // Marcar cada migração como aplicada (baseline)
      for (const migration of migrations) {
        try {
          console.log(`   📝 Marcando migração como aplicada: ${migration}`);
          // O comando resolve precisa do nome da migração (nome da pasta)
          execSync(`npx prisma migrate resolve --applied "${migration}"`, {
            stdio: 'pipe',
            env: process.env,
          });
          console.log(`   ✅ Migração ${migration} marcada como aplicada`);
        } catch (resolveError: any) {
          const errorMsg = resolveError.stdout?.toString() || resolveError.stderr?.toString() || resolveError.message || '';
          // Se a migração já estiver marcada, continuar
          if (errorMsg.includes('already applied') || errorMsg.includes('already exists')) {
            console.log(`   ✅ Migração ${migration} já estava marcada como aplicada`);
            continue;
          }
          // Se for outro erro, apenas avisar mas continuar
          console.warn(`   ⚠️  Aviso ao marcar ${migration}:`, errorMsg.substring(0, 200));
        }
      }

      console.log('✅ [MIGRATIONS] Baseline concluído! Todas as migrações foram marcadas como aplicadas.');
      process.exit(0);
    } else {
      // Outro erro, mostrar e falhar
      console.error('❌ [MIGRATIONS] Erro ao aplicar migrações:', errorOutput);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error('❌ [MIGRATIONS] Erro fatal:', error);
  process.exit(1);
});

