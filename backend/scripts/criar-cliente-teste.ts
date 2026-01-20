// Script para criar usuário cliente de teste
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function criarClienteTeste() {
  try {
    console.log('🔧 Criando cliente de teste...');

    // Hash da senha
    const senhaHash = await bcrypt.hash('123456', 10);

    // Buscar uma barbearia existente (ou criar uma se não existir)
    let barbearia = await prisma.barbearia.findFirst({
      where: {
        status: {
          in: ['ativo', 'em_teste'],
        },
      },
    });

    if (!barbearia) {
      console.log('⚠️  Nenhuma barbearia encontrada. Criando barbearia de teste...');
      
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + 30);

      barbearia = await prisma.barbearia.create({
        data: {
          nome: 'Barbearia Teste',
          cnpjCpf: '12.345.678/0001-90',
          responsavel: 'João Silva',
          plano: 'basico',
          email: 'teste@barbearia.com',
          telefone: '11999999999',
          endereco: 'Rua Teste, 123 - São Paulo, SP',
          dataVencimento,
          status: 'em_teste',
        },
      });

      console.log('✅ Barbearia de teste criada!');
    }

    // Criar cliente
    const cliente = await prisma.cliente.create({
      data: {
        nome: 'Cliente Teste',
        email: 'cliente@teste.com',
        telefone: '11988888888',
        senha: senhaHash,
        emailVerificado: true,
        ativo: true,
      },
    });

    console.log('✅ Cliente de teste criado com sucesso!');
    console.log('\n📋 Credenciais de Acesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: cliente@teste.com');
    console.log('🔑 Senha: 123456');
    console.log('🏢 Barbearia disponível: ' + barbearia.nome);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Use essas credenciais para fazer login no painel do cliente!');
    console.log('💡 Você pode agendar serviços na barbearia: ' + barbearia.nome);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Erro ao criar cliente de teste:', error);
    
    // Se o cliente já existe, informar
    if (error.code === 'P2002') {
      console.log('\n⚠️  Cliente já existe!');
      console.log('📧 Email: cliente@teste.com');
      console.log('🔑 Senha: 123456');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

criarClienteTeste();
