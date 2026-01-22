import prisma from '../src/lib/prisma';
import { verificarDisponibilidadeProfissional } from '../src/controllers/agendamentosController';

async function main() {
    console.log('Testing Conflict Resolution...');

    // 1. Create Data
    const barbearia = await prisma.barbearia.create({
        data: {
            nome: 'Conflict Test Barber',
            cnpjCpf: '00000000000',
            responsavel: 'Tester',
            plano: 'basico',
            status: 'ativa',
            dataVencimento: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            email: 'test@conflict.com'
        }
    });

    const profissional = await prisma.profissional.create({
        data: {
            nome: 'Barber X',
            telefone: '000',
            barbeariaId: barbearia.id
        }
    });

    const servico = await prisma.servico.create({
        data: {
            nome: 'Corte',
            preco: 50,
            duracao: 60,
            barbeariaId: barbearia.id
        }
    });

    // 2. Create Appointment 1 at 18:00
    // Note: App expects 'data' as Date in correct formatting and 'horario' as string.
    // We mimic 'criarAgendamento' logic: new Date(`${data}T${horario}:00-03:00`)
    // Date: 2024-01-20 (Arbitrary future date to avoid past validations if any)
    // Ensure we pick a date that hasn't passed if there are strict validations, though code didn't seem to have strict "future only" check in create?
    // Actually verifyDisponibilidade doesn't check "past".

    const dataString = "2025-06-20";
    const horario = "18:00";

    // Logic in controller: new Date(`${dataString}T${horario}:00-03:00`)
    const dataAgendamento = new Date(`${dataString}T${horario}:00-03:00`);

    await prisma.agendamento.create({
        data: {
            barbeariaId: barbearia.id,
            servicoId: servico.id,
            horario: horario,
            data: dataAgendamento,
            cliente: 'Client A',
            telefone: '111',
            status: 'confirmado',
            profissionais: {
                create: { profissionalId: profissional.id }
            }
        }
    });

    console.log(`Created Appointment A at ${dataString} ${horario}`);
    console.log(`Timestamp DB: ${dataAgendamento.toISOString()}`);

    // 3. Test Conflict for SAME time
    const isAvailable = await verificarDisponibilidadeProfissional(
        profissional.id,
        dataString,
        horario,
        60,
        barbearia.id
    );

    console.log(`Is 18:00 available? ${isAvailable}`);

    if (isAvailable) {
        console.error("FAIL: 18:00 should NOT be available!");
    } else {
        console.log("PASS: 18:00 is blocked.");
    }

    // Cleanup
    console.log('Cleaning up...');
    await prisma.barbearia.delete({ where: { id: barbearia.id } });
}

main();
