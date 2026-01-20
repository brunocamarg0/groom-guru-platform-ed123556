import prisma from '../src/lib/prisma';

async function verificarBarbearia() {
    const email = 'brunocamargocontato@hotmail.com';

    console.log(`\n🔍 Buscando barbearia com email: ${email}\n`);

    try {
        // Buscar barbearia pelo email
        const barbearia = await prisma.barbearia.findFirst({
            where: { email },
            include: {
                servicos: true,
                profissionais: true,
                dono: true,
                _count: {
                    select: {
                        agendamentos: true,
                    }
                }
            }
        });

        if (!barbearia) {
            console.log('❌ Barbearia não encontrada com esse email');

            // Tentar buscar dono com esse email
            const dono = await prisma.usuarioDono.findFirst({
                where: { email },
                include: { barbearia: true }
            });

            if (dono) {
                console.log(`\n✅ Encontrado DONO com esse email:`);
                console.log(`   ID: ${dono.id}`);
                console.log(`   Nome: ${dono.nome}`);
                console.log(`   BarbeariaId: ${dono.barbeariaId}`);
                console.log(`   Barbearia: ${dono.barbearia?.nome || 'N/A'}`);
            }
            return;
        }

        console.log('✅ BARBEARIA ENCONTRADA:');
        console.log(`   ID: ${barbearia.id}`);
        console.log(`   Nome: ${barbearia.nome}`);
        console.log(`   Status: ${barbearia.status}`);
        console.log(`   Email: ${barbearia.email}`);

        console.log(`\n📌 DONO:`);
        if (barbearia.dono) {
            console.log(`   ID: ${barbearia.dono.id}`);
            console.log(`   Nome: ${barbearia.dono.nome}`);
            console.log(`   Email: ${barbearia.dono.email}`);
        } else {
            console.log(`   ⚠️ Nenhum dono vinculado!`);
        }

        console.log(`\n✂️ SERVIÇOS (${barbearia.servicos.length}):`);
        barbearia.servicos.forEach(s => {
            console.log(`   - [${s.id}] ${s.nome} (Ativo: ${s.ativo}) - R$ ${s.preco}`);
        });

        console.log(`\n👨‍💼 PROFISSIONAIS (${barbearia.profissionais.length}):`);
        barbearia.profissionais.forEach(p => {
            console.log(`   - [${p.id}] ${p.nome} (Ativo: ${p.ativo})`);
        });

        console.log(`\n📅 AGENDAMENTOS: ${barbearia._count.agendamentos}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarBarbearia();
