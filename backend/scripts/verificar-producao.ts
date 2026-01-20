import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function verificarDados() {
    const logPath = path.join(__dirname, 'verificacao_producao.txt');
    const lines: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        lines.push(msg);
    };

    try {
        log('=== VERIFICAÇÃO DE DADOS DE PRODUÇÃO ===');
        log(`Data: ${new Date().toISOString()}`);
        log('');

        // 1. Barbearias
        const barbearias = await prisma.barbearia.findMany({
            include: {
                servicos: true,
                profissionais: true,
            }
        });
        log(`📌 BARBEARIAS: ${barbearias.length}`);
        barbearias.forEach(b => {
            log(`  - [${b.id}] ${b.nome}`);
            log(`    Email: ${b.email}`);
            log(`    Serviços: ${b.servicos.length}`);
            log(`    Profissionais: ${b.profissionais.length}`);
        });
        log('');

        // 2. Clientes
        const clientes = await prisma.cliente.findMany();
        log(`📌 CLIENTES: ${clientes.length}`);
        clientes.slice(0, 5).forEach(c => log(`  - [${c.id}] ${c.nome} (${c.email})`));
        if (clientes.length > 5) log(`  ... e mais ${clientes.length - 5}`);
        log('');

        // 3. Agendamentos
        const agendamentos = await prisma.agendamento.findMany({
            include: {
                barbearia: true,
                servico: true,
            }
        });
        log(`📌 AGENDAMENTOS: ${agendamentos.length}`);
        agendamentos.slice(0, 5).forEach(a => {
            log(`  - [${a.id}] ${a.data.toISOString()} | ${a.status}`);
            log(`    Barbearia: ${a.barbearia?.nome || 'N/A'}`);
            log(`    Serviço: ${a.servico?.nome || 'N/A'}`);
        });
        if (agendamentos.length > 5) log(`  ... e mais ${agendamentos.length - 5}`);
        log('');

        // 4. Usuários Dono
        const donos = await prisma.usuarioDono.findMany({
            include: {
                barbearia: true
            }
        });
        log(`📌 DONOS: ${donos.length}`);
        donos.forEach(d => {
            log(`  - [${d.id}] ${d.nome} (${d.email})`);
            log(`    Barbearia: ${d.barbearia?.nome || 'SEM BARBEARIA'} (${d.barbeariaId})`);
        });

    } catch (error) {
        log(`❌ ERRO: ${error}`);
    } finally {
        await prisma.$disconnect();
        fs.writeFileSync(logPath, lines.join('\n'));
        console.log(`\nLog salvo em: ${logPath}`);
    }
}

verificarDados();
