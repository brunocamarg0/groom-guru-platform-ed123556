import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function verificarEstado() {
    const logPath = path.join(__dirname, 'estado_sistema.txt');
    const lines: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        lines.push(msg);
    };

    try {
        log('--- Verificando Estado do Sistema ---');

        // 1. Barbearias
        const barbearias = await prisma.barbearia.findMany();
        log(`Barbearias: ${barbearias.length}`);
        barbearias.forEach(b => log(` - [${b.id}] ${b.nome} (${b.email})`));

        // 2. Clientes
        const clientes = await prisma.cliente.findMany();
        log(`Clientes: ${clientes.length}`);
        clientes.forEach(c => log(` - [${c.id}] ${c.nome} (${c.email})`));

        // 3. Agendamentos
        const agendamentos = await prisma.agendamento.findMany();
        log(`Agendamentos: ${agendamentos.length}`);
        agendamentos.forEach(a => log(` - [${a.id}] Data: ${a.data} Status: ${a.status} BarbeariaId: ${a.barbeariaId}`));

    } catch (error) {
        log(`ERRO: ${error}`);
    } finally {
        await prisma.$disconnect();
        fs.writeFileSync(logPath, lines.join('\n'));
        console.log(`Log salvo em: ${logPath}`);
    }
}

verificarEstado();
