import { supabase } from "@/integrations/supabase/client";

// Interface para item do pagamento
export interface PaymentItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  description?: string;
}

export interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  error?: string;
}

export interface PixResponse {
  success: boolean;
  paymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  status?: string;
  error?: string;
}

/**
 * Serviço de pagamento do Mercado Pago.
 *
 * IMPORTANTE: o access token do Mercado Pago NUNCA fica no frontend.
 * Todas as chamadas à API do MP acontecem em Edge Functions
 * (mercadopago-preference, mercadopago-pix, mercadopago-payment-status, mercadopago-webhook).
 */
class MercadoPagoService {
  isConfigured(): boolean {
    // O token vive no backend (Edge Function). O frontend sempre considera "configurado".
    return true;
  }

  async createPaymentPreference(
    items: PaymentItem[],
    customerData: CustomerData,
    agendamentoId: string,
  ): Promise<PaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-preference', {
        body: { items, customerData, agendamentoId },
      });
      if (error) throw error;
      return {
        success: true,
        paymentId: data?.paymentId,
        initPoint: data?.initPoint,
        sandboxInitPoint: data?.sandboxInitPoint,
      };
    } catch (error) {
      console.error('Erro ao criar preferência de pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async generatePixPayment(
    amount: number,
    customerData: CustomerData,
    agendamentoId: string,
  ): Promise<PixResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-pix', {
        body: { amount, customerData, agendamentoId },
      });
      if (error) throw error;
      return {
        success: true,
        paymentId: data?.paymentId,
        qrCode: data?.qrCode,
        qrCodeBase64: data?.qrCodeBase64,
        status: data?.status,
      };
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('mercadopago-payment-status', {
      body: { paymentId },
    });
    if (error) throw error;
    return data;
  }
}

export const mercadopagoService = new MercadoPagoService();
