# Configuração do Mercado Pago - BarberPro

## ✅ Credenciais Configuradas

Seu **Access Token de Produção** do Mercado Pago já está configurado:
```
APP_USR-8198153225284103-071221-68070ac52617404b0cdf2c61202ce95c-2557085916
```

## 🚀 Configuração Rápida

### 1. **Configurar Variáveis de Ambiente Localmente**

Crie um arquivo `.env` na raiz do projeto:

```env
# Mercado Pago - Access Token de Produção
VITE_MERCADOPAGO_ACCESS_TOKEN=APP_USR-8198153225284103-071221-68070ac52617404b0cdf2c61202ce95c-2557085916
```

⚠️ **IMPORTANTE**: Este é um token de **PRODUÇÃO** - pagamentos serão **REAIS**!

### 2. **Configurar no Vercel (Deploy)**

1. Acesse o painel do Vercel do seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável:
   - **Name**: `VITE_MERCADOPAGO_ACCESS_TOKEN`
   - **Value**: `APP_USR-8198153225284103-071221-68070ac52617404b0cdf2c61202ce95c-2557085916`
   - **Environment**: Production, Preview, Development
   
4. **Para Serverless Functions**, adicione também:
   - **Name**: `MERCADOPAGO_ACCESS_TOKEN`
   - **Value**: `APP_USR-8198153225284103-071221-68070ac52617404b0cdf2c61202ce95c-2557085916`
   - **Environment**: Production, Preview, Development

### 3. **Configurar Webhooks no Mercado Pago**

1. Acesse: [https://www.mercadopago.com.br/developers/panel/webhooks](https://www.mercadopago.com.br/developers/panel/webhooks)
2. Clique em **Criar Webhook**
3. Configure:
   - **URL**: `https://seu-dominio.vercel.app/api/pagamentos/webhook`
   - **Eventos**: Selecione `Pagamentos`
   - **Versão da API**: Use a versão mais recente
4. Salve e copie a URL do webhook

## 💳 Métodos de Pagamento Implementados

✅ **Cartão de Crédito/Débito** - Checkout redirect do Mercado Pago
✅ **PIX** - QR Code gerado automaticamente
✅ **Boleto** - Checkout redirect do Mercado Pago
✅ **Dinheiro** - Pagamento no local (registro local)

## 🧪 Testar Pagamentos

### **Modo de Teste (Sandbox)**

Para testar sem pagamentos reais, você precisa criar um token de teste:

1. Acesse: [https://www.mercadopago.com.br/developers/panel/credentials](https://www.mercadopago.com.br/developers/panel/credentials)
2. Copie seu **Access Token de Teste** (começa com `TEST-`)
3. Use no `.env`:
   ```env
   VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-seu_token_de_teste_aqui
   ```

### **Cartões de Teste do Mercado Pago**

Use estes cartões para testes:

- **Aprovado**: `5031 4332 1540 6351`
- **Recusado**: `5031 4332 1540 6369`
- **Requer autenticação**: `5031 4332 1540 6377`

Use qualquer data futura e qualquer CVV (3 dígitos).

### **Pagamento Real (Produção)**

⚠️ **ATENÇÃO**: Com o token de produção, todos os pagamentos são **REAIS**!

- Use qualquer cartão de crédito/débito real
- O dinheiro será debitado normalmente
- Taxas do Mercado Pago aplicadas:
  - Cartão: ~4.99% + R$ 0,60
  - PIX: ~1.99% + R$ 0,60
  - Boleto: ~1.99% + R$ 0,60

**Recomendação**: Teste primeiro com valores pequenos (R$ 1,00)

## 📋 Fluxo de Pagamento

1. **Cliente** → Faz agendamento → Checkout
2. **Cliente** → Escolhe método de pagamento
3. **Sistema** → Cria preferência/pagamento no Mercado Pago
4. **Mercado Pago** → Redireciona para checkout (cartão/boleto) ou gera QR Code (PIX)
5. **Cliente** → Realiza pagamento
6. **Mercado Pago** → Envia webhook para `/api/pagamentos/webhook`
7. **Sistema** → Atualiza status do agendamento

## 🔧 Estrutura de Arquivos

```
api/
  pagamentos/
    pix.js          # Endpoint para gerar PIX
    webhook.js      # Endpoint para receber webhooks do Mercado Pago

src/
  services/
    mercadopagoService.ts  # Serviço de integração com Mercado Pago
  
  pages/
    client/
      Checkout.tsx              # Página de checkout
      PagamentoSucesso.tsx      # Página de sucesso
      PagamentoFalha.tsx        # Página de falha
      PagamentoPendente.tsx     # Página de pendente
```

## 📊 Status de Pagamento

O sistema mapeia os status do Mercado Pago para o sistema interno:

- `approved` → `confirmado`
- `rejected` → `cancelado`
- `cancelled` → `cancelado`
- `pending` → `pagamento_pendente`
- `in_process` → `pagamento_pendente`
- `authorized` → `pagamento_pendente`

## 🔐 Segurança

⚠️ **NUNCA**:
- Exponha o Access Token no código do frontend (já está correto usando variável de ambiente)
- Faça chamadas diretas ao Mercado Pago do frontend sem backend
- Ignore erros de pagamento

✅ **SEMPRE**:
- Use HTTPS em produção
- Valide pagamentos no backend via webhooks
- Mantenha as credenciais em variáveis de ambiente
- Implemente logs para auditoria

## 📞 Suporte

- **Mercado Pago**: [https://www.mercadopago.com.br/developers/support](https://www.mercadopago.com.br/developers/support)
- **Documentação**: [https://www.mercadopago.com.br/developers/pt/docs](https://www.mercadopago.com.br/developers/pt/docs)
- **Status**: [https://status.mercadopago.com.br/](https://status.mercadopago.com.br/)

## ✅ Checklist de Configuração

- [x] Access Token configurado
- [ ] Variável de ambiente configurada localmente (`.env`)
- [ ] Variável de ambiente configurada no Vercel
- [ ] Webhook configurado no painel do Mercado Pago
- [ ] Teste de pagamento realizado (sandbox ou produção)
- [ ] URLs de retorno testadas

## 🚨 Próximos Passos

1. Teste o sistema localmente com token de teste
2. Configure as variáveis de ambiente no Vercel
3. Configure o webhook no Mercado Pago
4. Teste um pagamento real com valor pequeno (R$ 1,00)
5. Verifique se o webhook está funcionando
6. Ajuste conforme necessário

**Pronto para usar! 🎉**

