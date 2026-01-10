# Configuração do Stripe para Pagamentos

Este documento explica como configurar o Stripe para usar pagamentos reais no painel do cliente.

## 1. Criar Conta no Stripe

1. Acesse [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crie uma conta (pode usar modo de teste)
3. Complete o cadastro da sua empresa

## 2. Obter Chaves da API

1. No dashboard do Stripe, vá em **Desenvolvedores** → **Chaves da API**
2. Copie sua **Chave Publicável** (Publishable key) - começa com `pk_test_` ou `pk_live_`
3. Copie sua **Chave Secreta** (Secret key) - começa com `sk_test_` ou `sk_live_`

⚠️ **IMPORTANTE**: A chave secreta nunca deve ser exposta no frontend! Ela deve ser usada apenas no backend.

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou adicione ao `.env` existente):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
```

**Para produção**, use a chave live:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
```

## 4. Configurar Backend (Recomendado)

O código atual simula pagamentos, mas para uso real você precisa:

### 4.1. Criar um endpoint no backend para Payment Intent

```javascript
// Exemplo Node.js/Express
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/payment-intent', async (req, res) => {
  const { amount, currency = 'brl', metadata } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // em centavos
      currency,
      metadata,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4.2. Atualizar o arquivo `src/lib/stripe.ts`

O arquivo já está preparado para chamar o endpoint `/api/payment-intent`. Certifique-se de que:

1. O backend está rodando
2. A URL da API está configurada corretamente
3. O endpoint retorna `{ clientSecret: "..." }`

## 5. Testar Pagamentos

### Cartões de Teste do Stripe

Use estes números de cartão para testes:

- **Sucesso**: `4242 4242 4242 4242`
- **Requer autenticação**: `4000 0025 0000 3155`
- **Recusado**: `4000 0000 0000 9995`

Use qualquer data futura e qualquer CVC (3 dígitos).

### Testar no Modo de Desenvolvimento

1. Execute `npm run dev`
2. Faça um agendamento como cliente
3. No checkout, selecione "Cartão de Crédito" ou "Cartão de Débito"
4. Use um dos cartões de teste acima
5. Complete o pagamento

## 6. Webhooks (Opcional mas Recomendado)

Para processar eventos do Stripe (confirmação de pagamento, reembolsos, etc.), configure webhooks:

1. No dashboard do Stripe, vá em **Desenvolvedores** → **Webhooks**
2. Clique em **Adicionar endpoint**
3. Configure a URL do seu backend (ex: `https://seu-dominio.com/api/webhooks/stripe`)
4. Selecione os eventos que deseja receber:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`

## 7. Alternativas ao Stripe

Se preferir usar outro gateway de pagamento:

### Mercado Pago
- Documentação: [https://www.mercadopago.com.br/developers/pt/docs](https://www.mercadopago.com.br/developers/pt/docs)
- SDK: `@mercadopago/sdk-react`

### PagSeguro
- Documentação: [https://dev.pagseguro.uol.com.br/docs](https://dev.pagseguro.uol.com.br/docs)

Para integrar, você precisaria:
1. Instalar o SDK do gateway escolhido
2. Atualizar `src/lib/stripe.ts` para usar o novo gateway
3. Atualizar `src/pages/client/Checkout.tsx` para usar os componentes do novo gateway

## 8. Segurança

⚠️ **NUNCA**:
- Exponha a chave secreta do Stripe no frontend
- Faça chamadas diretas ao Stripe do frontend (use sempre o backend)
- Armazene dados de cartão de forma insegura
- Ignore erros de pagamento

✅ **SEMPRE**:
- Use HTTPS em produção
- Valide pagamentos no backend
- Use webhooks para confirmar pagamentos
- Mantenha as chaves em variáveis de ambiente
- Implemente logs para auditoria

## Suporte

Para mais informações:
- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Suporte do Stripe](https://support.stripe.com)

