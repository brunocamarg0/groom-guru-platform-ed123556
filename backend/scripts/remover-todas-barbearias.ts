import prisma from '../src/lib/prisma';

async function removerTodasBarbearias() {
    console.log('🧹 Iniciando remoção de TODAS as barbearias...');

    try {
        const count = await prisma.barbearia.count();
        console.log(`📊 Total de barbearias encontradas: ${count}`);

        if (count === 0) {
            console.log('✅ Nenhuma barbearia para remover.');
            return;
        }

        console.log('⚠️  Removendo barbearias... (Isso apagará donos, agendamentos, serviços, profissionais, etc. em cascata)');

        // Com onDelete: Cascade configurado no schema, deletar a barbearia deve levar tudo junto
        const result = await prisma.barbearia.deleteMany({});

        console.log(`✅ Removidas ${result.count} barbearias com sucesso!`);

        // Verificar se sobrou algo (opcional)
        const donosCount = await prisma.usuarioDono.count();
        console.log(`📊 Total de donos restantes: ${donosCount}`);

    } catch (error) {
        console.error('❌ Erro ao remover barbearias:', error);
    } finally {
        await prisma.$disconnect();
    }
}

removerTodasBarbearias();
