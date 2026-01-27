/**
 * Script para alterar a senha de um usuário dono
 * 
 * Uso: npx tsx backend/scripts/alterar-senha-dono.ts [email] [nova-senha]
 * 
 * Se não fornecer email, será listado todos os donos para escolher
 * Se não fornecer senha, será solicitada interativamente
 */

import prisma from '../src/lib/prisma';
import { hashSenha } from '../src/utils/password';
import * as readline from 'readline';

function lerInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (resposta) => {
      rl.close();
      resolve(resposta);
    });
  });
}

async function listarDonos() {
  const donos = await prisma.usuarioDono.findMany({
    include: {
      barbearia: {
        select: {
          id: true,
          nome: true,
          status: true,
        },
      },
    },
    orderBy: {
      nome: 'asc',
    },
  });

  if (donos.length === 0) {
    console.log('⚠️  Nenhum dono encontrado no banco de dados');
    return [];
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 DONOS CADASTRADOS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  donos.forEach((dono, index) => {
    console.log(`${index + 1}. ${dono.nome}`);
    console.log(`   📧 Email: ${dono.email}`);
    console.log(`   🏢 Barbearia: ${dono.barbearia?.nome || 'N/A'}`);
    console.log(`   ✅ Ativo: ${dono.ativo ? 'Sim' : 'Não'}`);
    console.log(`   🔐 Tem senha: ${dono.senha ? 'Sim' : 'Não (apenas OAuth)'}`);
    console.log('');
  });

  return donos;
}

async function alterarSenhaDono() {
  try {
    const emailFornecido = process.argv[2];
    const senhaFornecida = process.argv[3];

    console.log('🔐 Alteração de senha do usuário dono');
    console.log('');

    let email = emailFornecido;
    let senha = senhaFornecida;

    // Se não forneceu email, listar donos e pedir para escolher
    if (!email) {
      const donos = await listarDonos();

      if (donos.length === 0) {
        console.error('❌ Não há donos cadastrados no sistema');
        process.exit(1);
      }

      const escolha = await lerInput(
        `\nDigite o número do dono (1-${donos.length}) ou o email: `
      );

      // Verificar se é um número
      const numero = parseInt(escolha);
      if (!isNaN(numero) && numero >= 1 && numero <= donos.length) {
        email = donos[numero - 1].email;
      } else {
        email = escolha.trim();
      }
    }

    if (!email || email.trim().length === 0) {
      console.error('❌ Email não pode estar vazio!');
      process.exit(1);
    }

    // Buscar dono
    const dono = await prisma.usuarioDono.findUnique({
      where: { email },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
            status: true,
          },
        },
      },
    });

    if (!dono) {
      console.error(`❌ Dono com email "${email}" não encontrado no banco de dados`);
      process.exit(1);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📧 Dono encontrado: ${dono.nome}`);
    console.log(`   Email: ${dono.email}`);
    console.log(`   Barbearia: ${dono.barbearia?.nome || 'N/A'}`);
    console.log(`   Ativo: ${dono.ativo ? 'Sim' : 'Não'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Se não forneceu senha, solicitar
    if (!senha) {
      senha = await lerInput('Digite a nova senha: ');

      if (!senha || senha.trim().length === 0) {
        console.error('❌ Senha não pode estar vazia!');
        process.exit(1);
      }
    }

    // Validação básica de senha
    if (senha.length < 6) {
      console.error('❌ A senha deve ter pelo menos 6 caracteres');
      process.exit(1);
    }

    // Hash da senha
    console.log('');
    console.log('🔐 Gerando hash da senha...');
    const senhaHash = await hashSenha(senha);
    console.log('✅ Hash gerado com sucesso');
    console.log('');

    // Atualizar senha
    console.log('🔐 Atualizando senha no banco de dados...');
    const donoAtualizado = await prisma.usuarioDono.update({
      where: { email },
      data: {
        senha: senhaHash,
        ativo: true, // Garantir que está ativo
      },
    });

    console.log('✅ Senha alterada com sucesso!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SENHA ALTERADA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 DADOS DO DONO:');
    console.log(`   ID: ${donoAtualizado.id}`);
    console.log(`   Nome: ${donoAtualizado.nome}`);
    console.log(`   Email: ${donoAtualizado.email}`);
    console.log(`   Barbearia: ${dono.barbearia?.nome || 'N/A'}`);
    console.log(`   Ativo: ${donoAtualizado.ativo ? 'Sim' : 'Não'}`);
    console.log('');
    console.log('🔑 CREDENCIAIS DE ACESSO:');
    console.log(`   Email: ${donoAtualizado.email}`);
    console.log(`   Nova Senha: ${senha}`);
    console.log('');
    console.log('⚠️ IMPORTANTE:');
    console.log('   - Guarde a senha em local seguro!');
    console.log('   - Você pode alterá-la novamente executando este script');
    console.log('   - Acesse: /login?tab=dono');
    console.log('');

  } catch (error: any) {
    console.error('❌ Erro ao alterar senha:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Código:', error.code);
    console.error('❌ Mensagem:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

alterarSenhaDono();
