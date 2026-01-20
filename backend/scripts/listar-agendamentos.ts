import prisma from '../src/lib/prisma';

async function listarAgendamentos() {
    try {
        const agendamentos = await prisma.agendamento.findMany({
            include: {
                clienteRel: true,
                barbearia: true,
                servico: true,
                profissionais: {
                    include: {
                        profissional: true
                    }
                }
            }
        });

        console.log(`📊 Total de agendamentos encontrados: ${agendamentos.length}`);

        agendamentos.forEach(ag => {
            console.log(`\n🆔 ID: ${ag.id}`);
            console.log(`📅 Data: ${ag.data.toISOString()} | Horário: ${ag.horario}`);
            console.log(`🏠 Barbearia: ${ag.barbearia.nome} (${ag.barbeariaId})`);
            console.log(`👤 Cliente: ${ag.clienteRel?.nome || ag.cliente} (${ag.clienteId})`);
            console.log(`✂️ Serviço: ${ag.servico.nome}`);
            console.log(`🚦 Status: ${ag.status}`);
            console.log(`-----------------------------------`);
        });

    } catch (error) {
        console.error('❌ Erro ao listar agendamentos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listarAgendamentos();
