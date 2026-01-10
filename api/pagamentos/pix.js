// API function para proxy de geração de pagamento PIX Mercado Pago
// Deploy no Vercel como serverless function

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const { amount, customerData, agendamentoId } = req.body;
    if (!amount || !customerData || !agendamentoId) {
      return res.status(400).json({ success: false, error: 'Dados obrigatórios ausentes' });
    }

    // Token seguro do Mercado Pago (use variável de ambiente no Vercel)
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      return res.status(500).json({ success: false, error: 'Token do Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN' });
    }

    console.log('📱 Gerando pagamento PIX no Mercado Pago...');
    console.log('💰 Valor:', amount);
    console.log('👤 Cliente:', customerData.name);

    // Validar valor mínimo do Mercado Pago
    // NOTA: Mercado Pago pode exigir valor mínimo de R$ 1,00 para alguns métodos
    // Para valores de teste (< R$ 1,00), tentar mesmo assim
    // Se falhar, ajuste para R$ 1,00 ou mais
    const valorFinal = Math.max(amount, 0.01); // Mínimo de 1 centavo
    
    if (amount < 1.0) {
      console.warn(`⚠️ Valor baixo detectado (R$ ${amount}). Mercado Pago pode exigir mínimo de R$ 1,00.`);
      console.warn('💡 Se o pagamento falhar, ajuste os preços dos serviços para R$ 1,00 ou mais.');
    }

    const paymentData = {
      transaction_amount: valorFinal,
      description: `Agendamento #${agendamentoId} - BarberPro`,
      payment_method_id: 'pix',
      payer: {
        email: customerData.email,
        first_name: customerData.name.split(' ')[0] || customerData.name,
        last_name: customerData.name.split(' ').slice(1).join(' ') || '',
        ...(customerData.phone && {
          phone: {
            number: customerData.phone.replace(/\D/g, '')
          }
        })
      },
      external_reference: agendamentoId,
      notification_url: `${req.headers.origin || 'https://seu-dominio.vercel.app'}/api/pagamentos/webhook`
    };

    const idempotencyKey = agendamentoId || `${Date.now()}-${Math.random()}`;

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro do Mercado Pago:', errorData);
      return res.status(500).json({ 
        success: false, 
        error: errorData.message || errorData.error || 'Erro ao gerar PIX' 
      });
    }

    const payment = await response.json();
    
    console.log('✅ PIX gerado com sucesso!');
    console.log('🆔 Payment ID:', payment.id);
    console.log('🔗 QR Code:', payment.point_of_interaction?.transaction_data?.qr_code);

    return res.status(200).json({
      success: true,
      paymentId: payment.id,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      status: payment.status,
      expiresAt: payment.date_of_expiration
    });
  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}

