/**
 * Script para criar usuários admin
 * 
 * Uso: npx tsx scripts/criar-admins.ts
 */

import prisma from '../src/lib/prisma';
import { hashSenha } from '../src/utils/password';

async function criarAdmins() {
  try {
    console.log('🔐 Criando usuários admin...');
    
    const admins = [
      {
        nome: 'Bernardo Strabelli',
        email: 'bernardostrabelli@gmail.com',
        senha: 'Squaredadmin',
      },
      {
        nome: 'Bruno Camargo',
        email: 'brunocamargocontato@hotmail.com',
        senha: 'Squaredadmin',
      },
    ];
    
    for (const admin of admins) {
      // Verificar se já existe
      const existente = await prisma.usuarioAdmin.findUnique({
        where: { email: admin.email },
      });
      
      if (existente) {
        console.log(`⚠️  Admin ${admin.email} já existe, atualizando senha...`);
        const senhaHash = await hashSenha(admin.senha);
        await prisma.usuarioAdmin.update({
          where: { email: admin.email },
          data: { 
            senha: senhaHash,
            ativo: true,
          },
        });
        console.log(`✅ Senha atualizada para ${admin.email}`);
      } else {
        const senhaHash = await hashSenha(admin.senha);
        await prisma.usuarioAdmin.create({
          data: {
            nome: admin.nome,
            email: admin.email,
            senha: senhaHash,
            role: 'admin',
            ativo: true,
          },
        });
        console.log(`✅ Admin criado: ${admin.email}`);
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ADMINS CRIADOS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email: bernardostrabelli@gmail.com');
    console.log('🔐 Senha: Squaredadmin');
    console.log('');
    console.log('📧 Email: brunocamargocontato@hotmail.com');
    console.log('🔐 Senha: Squaredadmin');
    console.log('');
    console.log('⚠️  NOTA: A aba Admin foi removida da tela de login.');
    console.log('   Os admins devem acessar diretamente: /admin');
    console.log('   Ou usar uma URL específica de login admin (se configurada)');
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Erro ao criar admins:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

criarAdmins();
