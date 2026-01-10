// Interface para item do pagamento
export interface PaymentItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  description?: string;
}

// Interface para preferência de pagamento
export interface PaymentPreference {
  items: PaymentItem[];
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: string;
  external_reference?: string;
  notification_url?: string;
}

// Interface para dados do cliente
export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
}

// Interface para resposta de pagamento
export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  error?: string;
}

// Interface para resposta PIX
export interface PixResponse {
  success: boolean;
  paymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  status?: string;
  error?: string;
}

// Serviço de pagamento do Mercado Pago
class MercadoPagoService {
  private readonly ACCESS_TOKEN = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN;
  private readonly BASE_URL = 'https://api.mercadopago.com';

  // Verificar se o token está configurado
  isConfigured(): boolean {
    return !!this.ACCESS_TOKEN;
  }

  // Criar preferência de pagamento (para checkout redirect)
  // Usa endpoint serverless para evitar problemas de CORS e segurança
  async createPaymentPreference(
    items: PaymentItem[],
    customerData: CustomerData,
    agendamentoId: string,
    baseUrl: string = window.location.origin
  ): Promise<PaymentResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Token do Mercado Pago não configurado. Configure VITE_MERCADOPAGO_ACCESS_TOKEN');
      }

      console.log('💳 Criando preferência de pagamento no Mercado Pago...');
      console.log('📦 Itens:', items);
      console.log('👤 Cliente:', customerData.name);

      // Validar valor mínimo do Mercado Pago (R$ 1,00 para alguns métodos)
      const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const valorMinimo = 1.0;
      
      if (total < valorMinimo) {
        console.warn(`⚠️ Valor muito baixo (R$ ${total}). Mercado Pago pode exigir mínimo de R$ ${valorMinimo}.`);
      }

      // Chamar endpoint serverless ao invés de fazer requisição direta do frontend
      // Isso evita problemas de CORS e mantém o token seguro no backend
      const apiUrl = import.meta.env.PROD 
        ? '/api/pagamentos/preference'
        : '/api/pagamentos/preference';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          customerData,
          agendamentoId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro ao criar preferência:', errorData);
        
        // Mensagem de erro mais clara
        let errorMessage = 'Erro ao criar preferência de pagamento';
        if (response.status === 401) {
          errorMessage = 'Token do Mercado Pago inválido ou não autorizado. Verifique as credenciais configuradas no Vercel.';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.details?.message) {
          errorMessage = errorData.details.message;
        }
        
        throw new Error(errorMessage);
      }

      const preference = await response.json();
      
      console.log('✅ Preferência criada com sucesso!');
      console.log('🔗 Init Point:', preference.initPoint);
      console.log('🆔 Payment ID:', preference.paymentId);

      return {
        success: true,
        paymentId: preference.paymentId,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint
      };

    } catch (error) {
      console.error('❌ Erro ao criar preferência de pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Gerar pagamento PIX
  async generatePixPayment(
    amount: number,
    customerData: CustomerData,
    agendamentoId: string
  ): Promise<PixResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Token do Mercado Pago não configurado. Configure VITE_MERCADOPAGO_ACCESS_TOKEN');
      }

      console.log('📱 Gerando pagamento PIX no Mercado Pago...');

      // Chamar o endpoint backend para gerar PIX
      // Em desenvolvimento, usar proxy do Vite; em produção, Vercel serve automaticamente
      const apiUrl = import.meta.env.PROD 
        ? '/api/pagamentos/pix'
        : '/api/pagamentos/pix';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount, 
          customerData, 
          agendamentoId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar PIX');
      }

      const payment = await response.json();
      
      console.log('✅ PIX gerado com sucesso!');
      console.log('🔗 QR Code:', payment.qrCode);

      return {
        success: true,
        paymentId: payment.paymentId,
        qrCode: payment.qrCode,
        qrCodeBase64: payment.qrCodeBase64,
        status: payment.status
      };
    } catch (error) {
      console.error('❌ Erro ao gerar PIX:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Verificar status do pagamento
  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Token do Mercado Pago não configurado');
      }

      const response = await fetch(`${this.BASE_URL}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao consultar pagamento');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao consultar pagamento:', error);
      throw error;
    }
  }

  // Processar webhook de pagamento
  async processWebhook(data: any): Promise<any> {
    try {
      console.log('📥 Webhook recebido:', data);
      
      // Verificar se é um pagamento
      if (data.type === 'payment') {
        const paymentId = data.data.id;
        const payment = await this.getPaymentStatus(paymentId);
        
        console.log('💳 Status do pagamento:', payment.status);
        
        return {
          paymentId,
          status: payment.status,
          externalReference: payment.external_reference,
          amount: payment.transaction_amount,
          paymentMethod: payment.payment_method_id
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }
}

export const mercadopagoService = new MercadoPagoService();

