/**
 * Script para corrigir/criar usuários admin no sistema
 * 
 * Uso: npx tsx backend/scripts/corrigir-usuarios-admin.ts [senha]
 * 
 * Se não fornecer senha, será usada uma senha padrão temporária
 */

import prisma from '../src/lib/prisma';
import { hashSenha } from '../src/utils/password';

interface AdminUser {
  email: string;
  nome: string;
}

const ADMIN_USERS: AdminUser[] = [
  {
    email: 'brunocamargocontato@hotmail.com',
    nome: 'Bruno Camargo',
  },
  {
    email: 'bernardostrabelli@gmail.com',
    nome: 'Bernardo Trabelli',
  },
];

async function corrigirUsuariosAdmin() {
  try {
    // Pegar senha do argumento ou usar padrão
    const senhaFornecida = process.argv[2];
    const senha = senhaFornecida || 'Admin123!@#';
    
    console.log('🔐 Iniciando correção de usuários admin...');
    console.log('');
    
    if (!senhaFornecida) {
      console.log('⚠️  Nenhuma senha fornecida, usando senha padrão temporária');
      console.log('⚠️  Use: npx tsx backend/scripts/corrigir-usuarios-admin.ts [sua-senha]');
      console.log('');
    }
    
    // Hash da senha
    console.log('🔐 Gerando hash da senha...');
    const senhaHash = await hashSenha(senha);
    console.log('✅ Hash gerado com sucesso');
    console.log('');
    
    // Processar cada usuário admin
    for (const adminUser of ADMIN_USERS) {
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📧 Processando: ${adminUser.email}`);
      console.log('═══════════════════════════════════════════════════════');
      
      // Verificar se já existe
      const adminExistente = await prisma.usuarioAdmin.findUnique({
        where: { email: adminUser.email },
      });
      
      if (adminExistente) {
        console.log('✅ Usuário já existe no banco de dados');
        console.log('🔧 Verificando e corrigindo dados...');
        
        // Atualizar usuário existente
        const adminAtualizado = await prisma.usuarioAdmin.update({
          where: { email: adminUser.email },
          data: {
            nome: adminUser.nome,
            senha: senhaHash, // Sempre atualizar senha para garantir que está hasheada
            ativo: true, // Garantir que está ativo
            role: 'admin', // Garantir role
          },
        });
        
        console.log('✅ Usuário atualizado com sucesso!');
        console.log(`   ID: ${adminAtualizado.id}`);
        console.log(`   Nome: ${adminAtualizado.nome}`);
        console.log(`   Email: ${adminAtualizado.email}`);
        console.log(`   Role: ${adminAtualizado.role}`);
        console.log(`   Ativo: ${adminAtualizado.ativo}`);
      } else {
        console.log('➕ Usuário não existe, criando novo...');
        
        // Criar novo usuário admin
        const novoAdmin = await prisma.usuarioAdmin.create({
          data: {
            nome: adminUser.nome,
            email: adminUser.email,
            senha: senhaHash,
            role: 'admin',
            ativo: true,
          },
        });
        
        console.log('✅ Usuário criado com sucesso!');
        console.log(`   ID: ${novoAdmin.id}`);
        console.log(`   Nome: ${novoAdmin.nome}`);
        console.log(`   Email: ${novoAdmin.email}`);
        console.log(`   Role: ${novoAdmin.role}`);
        console.log(`   Ativo: ${novoAdmin.ativo}`);
      }
      
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TODOS OS USUÁRIOS ADMIN FORAM CORRIGIDOS/CRIADOS!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 RESUMO:');
    console.log('');
    
    for (const adminUser of ADMIN_USERS) {
      console.log(`   📧 ${adminUser.email}`);
      console.log(`      Nome: ${adminUser.nome}`);
      console.log(`      Senha: ${senha}`);
      console.log('');
    }
    
    console.log('⚠️ IMPORTANTE:');
    console.log('   - Guarde a senha em local seguro!');
    console.log('   - Você pode alterá-la após fazer login no sistema');
    console.log('   - Acesse: /login?tab=admin');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Erro ao corrigir usuários admin:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Código:', error.code);
    console.error('❌ Mensagem:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

corrigirUsuariosAdmin();
