// API function para criar preferência de pagamento no Mercado Pago
// Deploy no Vercel como serverless function

export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tratar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const { items, customerData, agendamentoId } = req.body;
    
    if (!items || !customerData || !agendamentoId) {
      return res.status(400).json({ success: false, error: 'Dados obrigatórios ausentes' });
    }

    // Token seguro do Mercado Pago (use variável de ambiente no Vercel)
    // Tentar buscar de diferentes formas (Vercel pode usar nomes diferentes)
    const ACCESS_TOKEN = 
      process.env.MERCADOPAGO_ACCESS_TOKEN || 
      process.env.VITE_MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      process.env.MERCADOPAGO_TOKEN;
    
    console.log('🔍 Verificando token...');
    console.log('MERCADOPAGO_ACCESS_TOKEN:', process.env.MERCADOPAGO_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado');
    console.log('VITE_MERCADOPAGO_ACCESS_TOKEN:', process.env.VITE_MERCADOPAGO_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado');
    console.log('Todas variáveis MERCADO:', Object.keys(process.env).filter(k => k.includes('MERCADO') || k.includes('MP')));
    
    if (!ACCESS_TOKEN) {
      console.error('❌ Token do Mercado Pago não configurado');
      console.error('Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(k => k.includes('MERCADO') || k.includes('MP') || k.includes('TOKEN')));
      
      return res.status(500).json({ 
        success: false, 
        error: 'Token do Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN no Vercel',
        diagnostic: {
          MERCADOPAGO_ACCESS_TOKEN_exists: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
          VITE_MERCADOPAGO_ACCESS_TOKEN_exists: !!process.env.VITE_MERCADOPAGO_ACCESS_TOKEN,
          todas_variaveis_mercado: Object.keys(process.env).filter(k => k.toUpperCase().includes('MERCADO') || k.toUpperCase().includes('MP')),
          node_env: process.env.NODE_ENV,
          vercel_env: process.env.VERCEL_ENV,
          todas_variaveis_disponiveis: Object.keys(process.env).length
        },
        instructions: [
          '1. Acesse: https://vercel.com/brunos-projects-9672b208/groom-guru-platform',
          '2. Vá em Settings → Environment Variables',
          '3. Adicione: MERCADOPAGO_ACCESS_TOKEN = TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86',
          '4. Marque TODOS os ambientes: ✅ Production, ✅ Preview, ✅ Development',
          '5. Salve',
          '6. ⚠️ IMPORTANTE: Faça um NOVO deploy (Redeploy) após adicionar!',
          '7. Variáveis só ficam disponíveis em novos deploys!',
          '8. Teste novamente após o deploy terminar'
        ],
        test_url: 'https://groom-guru-platform.vercel.app/api/pagamentos/test-token'
      });
    }
    
    console.log('✅ Token encontrado! Tamanho:', ACCESS_TOKEN.length, 'Prefixo:', ACCESS_TOKEN.substring(0, 10) + '...');

    console.log('💳 Criando preferência de pagamento no Mercado Pago...');
    console.log('📦 Itens:', items);
    console.log('👤 Cliente:', customerData.name);
    console.log('🔑 Token configurado:', ACCESS_TOKEN ? 'Sim' : 'Não');

    // Validar valor mínimo
    const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const valorMinimo = 1.0;
    
    if (total < valorMinimo) {
      console.warn(`⚠️ Valor baixo (R$ ${total}). Mercado Pago pode exigir mínimo de R$ ${valorMinimo}.`);
    }

    // Formatar itens para o Mercado Pago
    const mpItems = items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: Math.max(item.unit_price, 0.01),
      currency_id: item.currency_id || 'BRL',
      description: item.description || ''
    }));

    // URLs de retorno
    const baseUrl = req.headers.origin || 'https://groom-guru-platform.vercel.app';
    const backUrls = {
      success: `${baseUrl}/client/pagamento/sucesso?agendamento=${agendamentoId}`,
      failure: `${baseUrl}/client/pagamento/falha?agendamento=${agendamentoId}`,
      pending: `${baseUrl}/client/pagamento/pendente?agendamento=${agendamentoId}`
    };

    // Dados da preferência
    const preferenceData = {
      items: mpItems,
      payer: {
        name: customerData.name,
        email: customerData.email,
        ...(customerData.phone && {
          phone: {
            number: customerData.phone.replace(/\D/g, '')
          }
        }),
        ...(customerData.address && {
          address: {
            street_name: customerData.address,
            zip_code: customerData.zipCode?.replace(/\D/g, ''),
            city: customerData.city
          }
        })
      },
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: agendamentoId,
      notification_url: `${baseUrl}/api/pagamentos/webhook`,
      statement_descriptor: 'BARBERMASTER',
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payment_methods: {
        excluded_payment_types: [],
        installments: 12
      }
    };

    console.log('📋 Enviando requisição para Mercado Pago...');
    console.log('🔗 URL:', 'https://api.mercadopago.com/checkout/preferences');

    // Fazer requisição para o Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': agendamentoId || `${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify(preferenceData)
    });

    const responseText = await response.text();
    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Resposta completa do Mercado Pago:', responseText);
    console.log('🔑 Token usado (primeiros 20 chars):', ACCESS_TOKEN.substring(0, 20) + '...');

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      console.error('❌ Erro do Mercado Pago:', JSON.stringify(errorData, null, 2));
      
      // Tratar erros específicos
      if (response.status === 401 || response.status === 403) {
        // Verificar se o token está presente mas inválido
        const errorMessage = errorData.message || errorData.error || 'Unauthorized';
        
        return res.status(401).json({ 
          success: false, 
          error: 'Token do Mercado Pago inválido ou não autorizado. Verifique as credenciais.',
          details: {
            status: response.status,
            message: errorMessage,
            full_error: errorData,
            token_prefix: ACCESS_TOKEN.substring(0, 15) + '...',
            token_length: ACCESS_TOKEN.length,
            possible_causes: [
              'Token incorreto ou copiado errado',
              'Token expirado ou regenerado no Mercado Pago',
              'Token não tem permissões para criar preferências de pagamento',
              'Token de TESTE pode estar sendo usado incorretamente'
            ],
            instructions: [
              '1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials',
              '2. Selecione a aplicação "Barber Payments"',
              '3. Copie o Access Token novamente (pode ter sido regenerado)',
              '4. Atualize no Vercel: Settings → Environment Variables',
              '5. Faça um novo Redeploy',
              '6. Verifique se o token é de TESTE: deve começar com "TEST-"'
            ]
          }
        });
      }
      
      // Erro genérico
      return res.status(response.status).json({ 
        success: false, 
        error: errorData.message || errorData.error || 'Erro ao criar preferência de pagamento',
        details: {
          status: response.status,
          full_error: errorData,
          response_text: responseText.substring(0, 500)
        }
      });
    }

    const preference = JSON.parse(responseText);
    
    console.log('✅ Preferência criada com sucesso!');
    console.log('🆔 Preference ID:', preference.id);
    console.log('🔗 Init Point:', preference.init_point);

    return res.status(200).json({
      success: true,
      paymentId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Erro ao criar preferência:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}

