import { loadStripe, Stripe } from "@stripe/stripe-js";

// Chave pública do Stripe (deve ser obtida do backend em produção)
// Para testes, use a chave de teste do Stripe
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Função para criar Payment Intent no backend
export const createPaymentIntent = async (amount: number, agendamentoId: string) => {
  // Em produção, isso deve chamar seu backend
  // Exemplo: const response = await fetch('/api/create-payment-intent', { ... })
  
  // Por enquanto, retornamos um mock
  // Em produção, você precisará criar um endpoint no backend que:
  // 1. Cria um Payment Intent no Stripe
  // 2. Retorna o client_secret
  
  try {
    // Simulação - em produção, substitua pela chamada real ao backend
    const response = await fetch('/api/payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: 'brl',
        metadata: {
          agendamentoId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar payment intent');
    }

    const data = await response.json();
    return data.clientSecret;
  } catch (error) {
    // Se não houver backend, retornamos null e usamos mock
    console.warn('Backend não disponível, usando modo de desenvolvimento');
    return null;
  }
};

