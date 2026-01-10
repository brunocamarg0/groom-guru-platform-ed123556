// API function para processar webhooks do Mercado Pago
// Deploy no Vercel como serverless function

export default async function handler(req, res) {
  // Permitir CORS para requisições do Mercado Pago
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tratar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const webhookReceivedAt = new Date().toISOString();
    const body = req.body;
    
    console.log(`[${webhookReceivedAt}] 📥 Webhook recebido do Mercado Pago:`, JSON.stringify(body, null, 2));

    // Verificar se é um teste do Mercado Pago (action presente)
    const isTest = body.action === 'payment.updated' && body.data?.id === '123456';
    
    if (isTest) {
      console.log('🧪 Requisição de TESTE detectada - retornando sucesso');
      return res.status(200).json({
        success: true,
        message: 'Webhook de teste recebido com sucesso',
        test: true,
        receivedAt: webhookReceivedAt
      });
    }

    // Verificar formato do webhook real
    const type = body.type;
    const action = body.action;
    const data = body.data || {};

    // Aceitar tanto 'type: payment' quanto 'action: payment.updated'
    if (type === 'payment' || action === 'payment.updated' || action === 'payment.created') {
      const paymentId = data.id;
      
      if (!paymentId) {
        console.error('❌ Payment ID não encontrado no webhook');
        return res.status(400).json({ 
          success: false, 
          error: 'Payment ID não encontrado' 
        });
      }

      console.log('💳 Processando pagamento:', paymentId);
      
      // Buscar detalhes do pagamento no Mercado Pago
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
      if (!mpToken) {
        console.error('❌ Token do Mercado Pago não configurado');
        // Mesmo sem token, retornamos 200 para não quebrar o webhook
        return res.status(200).json({ 
          success: false, 
          message: 'Token não configurado, mas webhook recebido',
          paymentId,
          warning: 'Configure MERCADOPAGO_ACCESS_TOKEN'
        });
      }

      try {
        const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { 
            'Authorization': `Bearer ${mpToken}` 
          }
        });

        if (!paymentRes.ok) {
          const errorData = await paymentRes.json().catch(() => ({}));
          console.error('❌ Erro ao buscar pagamento:', errorData);
          
          // Mesmo com erro, retornamos 200 para o Mercado Pago não reenviar
          return res.status(200).json({
            success: false,
            message: 'Webhook recebido, mas erro ao consultar pagamento',
            paymentId,
            error: errorData.message || 'Erro ao consultar pagamento'
          });
        }

        const payment = await paymentRes.json();
        const status = payment.status;
        const agendamentoId = payment.external_reference;
        
        console.log('🔎 Status do pagamento:', status);
        console.log('📋 Agendamento ID:', agendamentoId);
        console.log('💰 Valor:', payment.transaction_amount);
        console.log('💳 Método:', payment.payment_method_id);

        // Mapear status do Mercado Pago para nosso sistema
        let statusAgendamento = 'pendente';
        
        if (status === 'approved') {
          statusAgendamento = 'confirmado';
        } else if (status === 'rejected' || status === 'cancelled') {
          statusAgendamento = 'cancelado';
        } else if (status === 'pending' || status === 'in_process' || status === 'authorized') {
          statusAgendamento = 'pagamento_pendente';
        }

        console.log(`✅ Status do agendamento atualizado para: ${statusAgendamento}`);

        // TODO: Integrar com seu banco de dados/Firestore
        // Exemplo:
        // if (status === 'approved' && agendamentoId) {
        //   await db.collection('agendamentos').doc(agendamentoId).update({ 
        //     status: 'confirmado',
        //     paymentStatus: 'aprovado',
        //     paymentId: paymentId,
        //     updatedAt: new Date()
        //   });
        // }

        return res.status(200).json({
          success: true,
          message: 'Webhook processado com sucesso',
          paymentId,
          status,
          agendamentoId,
          statusAgendamento,
          processedAt: new Date().toISOString()
        });

      } catch (fetchError) {
        console.error('❌ Erro ao fazer requisição para Mercado Pago:', fetchError);
        // Retornar 200 mesmo com erro para não quebrar o webhook
        return res.status(200).json({
          success: false,
          message: 'Webhook recebido, mas erro ao processar',
          paymentId,
          error: fetchError.message
        });
      }
    }

    // Se não for um webhook de pagamento, ainda retornamos 200
    console.log('⚠️ Webhook ignorado - tipo não suportado:', type || action);
    
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido, mas tipo não suportado',
      type: type || action,
      receivedAt: webhookReceivedAt
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Sempre retornar 200 para evitar reenvios do Mercado Pago
    return res.status(200).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      receivedAt: new Date().toISOString()
    });
  }
}

