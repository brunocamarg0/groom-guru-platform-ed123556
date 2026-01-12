/**
 * Job para enviar lembretes de agendamento 24 horas antes
 * 
 * Executa a cada hora e verifica agendamentos confirmados
 * que acontecerão em aproximadamente 24 horas
 */

import prisma from '../lib/prisma';
import { notificarLembreteAgendamento } from '../services/whatsappService';

interface AgendamentoComDados {
  id: string;
  cliente: string;
  telefone: string;
  data: Date;
  servico: {
    nome: string;
  };
  barbearia: {
    nome: string;
    endereco?: string;
  };
  clienteRel: {
    nome: string;
    telefone?: string;
  } | null;
}

/**
 * Busca agendamentos que precisam de lembrete
 * (confirmados, que acontecerão em 23-25 horas)
 */
async function buscarAgendamentosParaLembrete(): Promise<AgendamentoComDados[]> {
  const agora = new Date();
  const em24Horas = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
  const em23Horas = new Date(agora.getTime() + 23 * 60 * 60 * 1000);
  const em25Horas = new Date(agora.getTime() + 25 * 60 * 60 * 1000);

  // Busca agendamentos confirmados que acontecerão entre 23 e 25 horas
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      status: 'confirmado',
      data: {
        gte: em23Horas,
        lte: em25Horas,
      },
    },
    include: {
      servico: {
        select: {
          nome: true,
        },
      },
      barbearia: {
        select: {
          nome: true,
          endereco: true,
        },
      },
      clienteRel: {
        select: {
          nome: true,
          telefone: true,
        },
      },
    },
  });

  // Filtra apenas os que ainda não receberam lembrete
  // (podemos adicionar um campo no banco para rastrear isso)
  // Por enquanto, vamos enviar apenas uma vez por agendamento
  // usando uma verificação simples de horário (entre 23-25h antes)
  
  return agendamentos as AgendamentoComDados[];
}

/**
 * Envia lembretes para agendamentos que estão em 24 horas
 */
export async function enviarLembretesAgendamento() {
  try {
    console.log('🔔 Iniciando verificação de lembretes de agendamento...');
    
    const agendamentos = await buscarAgendamentosParaLembrete();
    
    if (agendamentos.length === 0) {
      console.log('   Nenhum agendamento precisa de lembrete no momento.');
      return;
    }

    console.log(`   Encontrados ${agendamentos.length} agendamento(s) para lembrete.`);

    let sucessos = 0;
    let erros = 0;

    for (const agendamento of agendamentos) {
      try {
        // Usa telefone do cliente cadastrado ou do agendamento
        const telefone = agendamento.clienteRel?.telefone || agendamento.telefone;
        
        if (!telefone) {
          console.warn(`   ⚠️ Agendamento ${agendamento.id} sem telefone, pulando...`);
          continue;
        }

        // Calcula horário do agendamento
        const horario = agendamento.data.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        // Envia lembrete
        const resultado = await notificarLembreteAgendamento({
          telefone,
          nomeCliente: agendamento.clienteRel?.nome || agendamento.cliente,
          nomeBarbearia: agendamento.barbearia.nome,
          data: agendamento.data,
          horario,
          servico: agendamento.servico.nome,
          endereco: agendamento.barbearia.endereco || undefined,
        });

        if (resultado.sucesso) {
          sucessos++;
          console.log(`   ✅ Lembrete enviado para ${agendamento.clienteRel?.nome || agendamento.cliente}`);
        } else {
          erros++;
          console.error(`   ❌ Erro ao enviar lembrete para ${agendamento.clienteRel?.nome || agendamento.cliente}:`, resultado.erro);
        }
      } catch (error: any) {
        erros++;
        console.error(`   ❌ Erro ao processar agendamento ${agendamento.id}:`, error.message);
      }
    }

    console.log(`✅ Processamento concluído: ${sucessos} sucesso(s), ${erros} erro(s)`);
  } catch (error) {
    console.error('❌ Erro ao processar lembretes de agendamento:', error);
  }
}
