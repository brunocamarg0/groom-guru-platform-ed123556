const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limparDados() {
    console.log('🧹 Iniciando limpeza de dados...');

    try {
        // 1. Apagar AgendamentoProfissional (tabela de junção)
        console.log('Apagando AgendamentoProfissional...');
        // Verificando se o model existe, se não, ignora (em caso de mudança de schema)
        // Mas assumimos que existe.
        if (prisma.agendamentoProfissional) {
            await prisma.agendamentoProfissional.deleteMany({});
        }

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
