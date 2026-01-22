import prisma from '../src/lib/prisma';

async function limparDados() {
    console.log('🧹 Iniciando limpeza de dados...');

    try {
        // 1. Apagar AgendamentoProfissional (tabela de junção)
        console.log('Apagando AgendamentoProfissional...');
        await prisma.agendamentoProfissional.deleteMany({});

        // 2. Apagar Agendamentos
        console.log('Apagando Agendamentos...');
        await prisma.agendamento.deleteMany({});

        // 3. Apagar Serviços
        console.log('Apagando Serviços...');
        await prisma.servico.deleteMany({});

        // 4. Apagar Profissionais
        console.log('Apagando Profissionais...');
        await prisma.profissional.deleteMany({});

        // 5. Apagar Clientes
        console.log('Apagando Clientes...');
        await prisma.cliente.deleteMany({});

        console.log('✅ Dados limpos com sucesso! (Barbearias e Usuários Admin/Dono mantidos)');
    } catch (error) {
        console.error('❌ Erro ao limpar dados:', error);
    } finally {
        await prisma.$disconnect();
    }
}

limparDados();
