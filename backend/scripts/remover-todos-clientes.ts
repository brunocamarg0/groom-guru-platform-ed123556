import prisma from '../src/lib/prisma';

async function removerTodosClientes() {
    console.log('🧹 Iniciando remoção de TODOS os clientes...');

    try {
        const count = await prisma.cliente.count();
        console.log(`📊 Total de clientes encontrados: ${count}`);

        if (count === 0) {
            console.log('✅ Nenhum cliente para remover.');
            return;
        }

        console.log('⚠️  Removendo clientes... (Isso não apaga agendamentos, apenas desvincula)');
        const result = await prisma.cliente.deleteMany({});

        console.log(`✅ Removidos ${result.count} clientes com sucesso!`);
    } catch (error) {
        console.error('❌ Erro ao remover clientes:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removerTodosClientes();
