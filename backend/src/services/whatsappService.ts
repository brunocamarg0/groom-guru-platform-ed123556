/**
 * Serviço de Notificações WhatsApp
 * 
 * Suporta múltiplos provedores:
 * - Evolution API (recomendado para self-hosted)
 * - Twilio WhatsApp API
 * - Z-API
 * 
 * Configure as variáveis de ambiente no .env
 */

interface EnviarWhatsAppParams {
  telefone: string; // Formato: 5511999999999 (com código do país, sem +)
  mensagem: string;
  tipo?: 'texto' | 'template';
}

interface ResultadoEnvio {
  sucesso: boolean;
  messageId?: string;
  erro?: string;
}

/**
 * Formata número de telefone para formato internacional
 * Remove caracteres especiais e adiciona código do país se necessário
 */
function formatarTelefone(telefone: string): string {
  // Remove todos os caracteres não numéricos
  let numero = telefone.replace(/\D/g, '');
  
  // Se não começar com código do país (55 para Brasil), adiciona
  if (!numero.startsWith('55')) {
    numero = '55' + numero;
  }
  
  return numero;
}

/**
 * Envia mensagem via Evolution API
 * Documentação: https://doc.evolution-api.com/
 */
async function enviarViaEvolutionAPI(
  telefone: string,
  mensagem: string
): Promise<ResultadoEnvio> {
  const evolutionUrl = process.env.WHATSAPP_EVOLUTION_URL;
  const evolutionApiKey = process.env.WHATSAPP_EVOLUTION_API_KEY;
  const evolutionInstance = process.env.WHATSAPP_EVOLUTION_INSTANCE;

  if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
    throw new Error('Variáveis de ambiente do Evolution API não configuradas');
  }

  try {
    const response = await fetch(
      `${evolutionUrl}/message/sendText/${evolutionInstance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: telefone,
          text: mensagem,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro Evolution API:', error);
      return {
        sucesso: false,
        erro: `Evolution API: ${error}`,
      };
    }

    const data = await response.json();
    return {
      sucesso: true,
      messageId: data.key?.id || data.messageId,
    };
  } catch (error: any) {
    console.error('Erro ao enviar via Evolution API:', error);
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Envia mensagem via Twilio WhatsApp API
 */
async function enviarViaTwilio(
  telefone: string,
  mensagem: string
): Promise<ResultadoEnvio> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // whatsapp:+14155238886

  if (!accountSid || !authToken || !twilioWhatsAppNumber) {
    throw new Error('Variáveis de ambiente do Twilio não configuradas');
  }

  try {
    // Formata telefone para formato Twilio: whatsapp:+5511999999999
    const telefoneFormatado = `whatsapp:+${telefone}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: twilioWhatsAppNumber,
          To: telefoneFormatado,
          Body: mensagem,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro Twilio:', error);
      return {
        sucesso: false,
        erro: `Twilio: ${error.message || 'Erro desconhecido'}`,
      };
    }

    const data = await response.json();
    return {
      sucesso: true,
      messageId: data.sid,
    };
  } catch (error: any) {
    console.error('Erro ao enviar via Twilio:', error);
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Envia mensagem via Z-API
 */
async function enviarViaZAPI(
  telefone: string,
  mensagem: string
): Promise<ResultadoEnvio> {
  const zapiUrl = process.env.ZAPI_URL;
  const zapiToken = process.env.ZAPI_TOKEN;
  const zapiInstance = process.env.ZAPI_INSTANCE;

  if (!zapiUrl || !zapiToken || !zapiInstance) {
    throw new Error('Variáveis de ambiente do Z-API não configuradas');
  }

  try {
    const response = await fetch(
      `${zapiUrl}/v1/messages/text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${zapiToken}`,
        },
        body: JSON.stringify({
          phone: telefone,
          message: mensagem,
          instanceId: zapiInstance,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro Z-API:', error);
      return {
        sucesso: false,
        erro: `Z-API: ${error}`,
      };
    }

    const data = await response.json();
    return {
      sucesso: true,
      messageId: data.id || data.messageId,
    };
  } catch (error: any) {
    console.error('Erro ao enviar via Z-API:', error);
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Função principal para enviar mensagem WhatsApp
 * Seleciona o provedor baseado nas variáveis de ambiente
 */
export async function enviarWhatsApp(
  params: EnviarWhatsAppParams
): Promise<ResultadoEnvio> {
  const { telefone, mensagem } = params;
  
  // Formata telefone
  const telefoneFormatado = formatarTelefone(telefone);

  // Determina qual provedor usar baseado nas variáveis de ambiente
  const provedor = process.env.WHATSAPP_PROVIDER || 'evolution';

  try {
    let resultado: ResultadoEnvio;

    switch (provedor.toLowerCase()) {
      case 'evolution':
        resultado = await enviarViaEvolutionAPI(telefoneFormatado, mensagem);
        break;
      
      case 'twilio':
        resultado = await enviarViaTwilio(telefoneFormatado, mensagem);
        break;
      
      case 'zapi':
        resultado = await enviarViaZAPI(telefoneFormatado, mensagem);
        break;
      
      default:
        throw new Error(`Provedor WhatsApp desconhecido: ${provedor}`);
    }

    if (resultado.sucesso) {
      console.log(`✅ WhatsApp enviado para ${telefoneFormatado}`);
    } else {
      console.error(`❌ Erro ao enviar WhatsApp para ${telefoneFormatado}:`, resultado.erro);
    }

    return resultado;
  } catch (error: any) {
    console.error('Erro ao enviar WhatsApp:', error);
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido ao enviar WhatsApp',
    };
  }
}

/**
 * Notificação de confirmação de agendamento
 */
export async function notificarConfirmacaoAgendamento(params: {
  telefone: string;
  nomeCliente: string;
  nomeBarbearia: string;
  data: Date;
  horario: string;
  servico: string;
  profissional?: string;
}) {
  const { telefone, nomeCliente, nomeBarbearia, data, horario, servico, profissional } = params;
  
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const mensagem = `✅ *Agendamento Confirmado!*

Olá ${nomeCliente}!

Seu agendamento na *${nomeBarbearia}* foi confirmado:

📅 *Data:* ${dataFormatada}
🕐 *Horário:* ${horario}
✂️ *Serviço:* ${servico}${profissional ? `\n👤 *Profissional:* ${profissional}` : ''}

Estamos ansiosos para atendê-lo!

_Esta é uma mensagem automática. Por favor, não responda._`;

  return await enviarWhatsApp({ telefone, mensagem });
}

/**
 * Notificação de recusa de agendamento
 */
export async function notificarRecusaAgendamento(params: {
  telefone: string;
  nomeCliente: string;
  nomeBarbearia: string;
  data: Date;
  horario: string;
  servico: string;
  motivo?: string;
}) {
  const { telefone, nomeCliente, nomeBarbearia, data, horario, servico, motivo } = params;
  
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const mensagem = `❌ *Agendamento Recusado*

Olá ${nomeCliente},

Infelizmente, não foi possível confirmar seu agendamento na *${nomeBarbearia}*:

📅 *Data:* ${dataFormatada}
🕐 *Horário:* ${horario}
✂️ *Serviço:* ${servico}${motivo ? `\n\n*Motivo:* ${motivo}` : ''}

Por favor, entre em contato conosco para reagendar em outro horário.

_Esta é uma mensagem automática. Por favor, não responda._`;

  return await enviarWhatsApp({ telefone, mensagem });
}

/**
 * Lembrete de agendamento (24 horas antes)
 */
export async function notificarLembreteAgendamento(params: {
  telefone: string;
  nomeCliente: string;
  nomeBarbearia: string;
  data: Date;
  horario: string;
  servico: string;
  profissional?: string;
  endereco?: string;
}) {
  const { telefone, nomeCliente, nomeBarbearia, data, horario, servico, profissional, endereco } = params;
  
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const mensagem = `⏰ *Lembrete de Agendamento*

Olá ${nomeCliente}!

Este é um lembrete do seu agendamento na *${nomeBarbearia}*:

📅 *Data:* ${dataFormatada}
🕐 *Horário:* ${horario}
✂️ *Serviço:* ${servico}${profissional ? `\n👤 *Profissional:* ${profissional}` : ''}${endereco ? `\n📍 *Endereço:* ${endereco}` : ''}

Nos vemos amanhã! 🎉

_Esta é uma mensagem automática. Por favor, não responda._`;

  return await enviarWhatsApp({ telefone, mensagem });
}
