#!/usr/bin/env tsx
/**
 * Script para verificar se o banco de dados está disponível
 */

import prisma from '../lib/prisma';

async function main() {
  try {
    console.log('🔍 Verificando conexão com o banco de dados...');
    
    // Tentar fazer uma query simples
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Banco de dados está disponível e conectado!');
    
    // Verificar se as tabelas existem
    console.log('\n📋 Verificando tabelas existentes...');
    
    const tabelas = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log(`\n✅ Encontradas ${tabelas.length} tabelas:`);
    tabelas.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.tablename}`);
    });
    
    // Verificar se as novas tabelas já existem
    const novasTabelas = [
      'PlanoCliente',
      'AssinaturaCliente',
      'PagamentoAssinatura',
      'ComissaoAssinatura',
      'ClienteProfissional'
    ];
    
    console.log('\n🔍 Verificando novas tabelas...');
    const tabelasExistentes = tabelas.map(t => t.tablename);
    
    novasTabelas.forEach(tabela => {
      if (tabelasExistentes.includes(tabela)) {
        console.log(`   ✅ ${tabela} - JÁ EXISTE`);
      } else {
        console.log(`   ❌ ${tabela} - NÃO EXISTE (precisa migração)`);
      }
    });
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao conectar com o banco de dados:');
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Dica: O banco de dados não está acessível.');
      console.error('   Verifique se:');
      console.error('   - A variável DATABASE_URL está configurada corretamente');
      console.error('   - O banco de dados está rodando');
      console.error('   - As credenciais estão corretas');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

