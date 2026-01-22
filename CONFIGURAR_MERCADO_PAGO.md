# 💳 Como Configurar Mercado Pago

Este guia explica como configurar o Mercado Pago para processar pagamentos online no sistema.

## 📋 Pré-requisitos

1. Conta no Mercado Pago (https://www.mercadopago.com.br)
2. Acesso ao painel do Mercado Pago
3. Credenciais de acesso (Access Token)

---

## 🔧 Passo 1: Criar Aplicação no Mercado Pago

1. **Acesse:** https://www.mercadopago.com.br/developers/panel/app
2. **Faça login** na sua conta
3. **Clique em "Criar aplicação"**
4. **Preencha os dados:**
   - **Nome:** Groom Guru Platform
   - **Descrição:** Sistema de agendamento para barbearias
   - **Plataforma:** Web
5. **Clique em "Criar"**

---

## 🔑 Passo 2: Obter Access Token

1. **No painel da aplicação**, vá em **"Credenciais"**
2. **Copie o "Access Token"** (Test ou Production)
   - **Test:** Para desenvolvimento/testes
   - **Production:** Para produção (requer verificação de conta)

### ⚠️ Importante:
- Use **Test Token** durante desenvolvimento
- Use **Production Token** apenas em produção
- **NUNCA** compartilhe seu Access Token publicamente

---

## 🌐 Passo 3: Configurar no Railway (Backend)

1. **Acesse:** https://railway.app
2. **Abra seu projeto** do backend
3. **Vá em Settings → Variables**
4. **Adicione a variável:**
   ```
   MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
   ```
5. **Salve** as alterações

---

## 🔗 Passo 4: Configurar URLs de Retorno

O sistema já está configurado para usar as seguintes URLs de retorno:

- **Sucesso:** `https://seu-frontend.com/cliente/pagamento/sucesso`
- **Falha:** `https://seu-frontend.com/cliente/pagamento/falha`
- **Pendente:** `https://seu-frontend.com/cliente/pagamento/pendente`

### Configurar no Mercado Pago:

1. **No painel da aplicação**, vá em **"Webhooks"**
2. **Adicione a URL do webhook:**
   ```
   https://seu-backend.railway.app/api/pagamentos/webhook
   ```
3. **Selecione os eventos:**
   - `payment`
   - `payment.updated`
4. **Salve** as configurações

---

## 🧪 Passo 5: Testar em Desenvolvimento

### Usar Cartões de Teste:

O Mercado Pago fornece cartões de teste para desenvolvimento:

**Cartão Aprovado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Data: Qualquer data futura
- Nome: Qualquer nome

**Cartão Recusado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Data: Qualquer data futura
- Nome: Qualquer nome

Mais cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/test-cards

---

## 🚀 Passo 6: Executar Migration

Execute a migration para adicionar os campos necessários no banco:

```bash
cd backend
npx prisma migrate deploy
```

Ou se estiver em desenvolvimento:

```bash
npx prisma migrate dev
```

---

## ✅ Verificar Configuração

1. **Crie um agendamento** no sistema
2. **Selecione "Pagamento Online"**
3. **Você deve ser redirecionado** para o checkout do Mercado Pago
4. **Use um cartão de teste** para completar o pagamento
5. **Verifique** se o status do pagamento foi atualizado no sistema

---

## 🐛 Troubleshooting

### Erro: "Access Token inválido"
- Verifique se o `MERCADOPAGO_ACCESS_TOKEN` está configurado corretamente no Railway
- Certifique-se de que está usando o token correto (Test ou Production)

### Erro: "Webhook não recebido"
- Verifique se a URL do webhook está acessível publicamente
- Certifique-se de que o Railway está rodando e acessível
- Verifique os logs do backend para ver se o webhook está sendo chamado

### Pagamento não atualiza status
- Verifique se o webhook está configurado corretamente no Mercado Pago
- Verifique os logs do backend para erros
- Certifique-se de que o `external_reference` está sendo passado corretamente

---

## 📚 Documentação Adicional

- **Mercado Pago Developers:** https://www.mercadopago.com.br/developers/pt/docs
- **Checkout Pro:** https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing
- **Webhooks:** https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

---

## 🔒 Segurança

- **NUNCA** commite o Access Token no código
- Use variáveis de ambiente para armazenar credenciais
- Use HTTPS em produção
- Valide sempre os webhooks recebidos do Mercado Pago

---

## 💡 Dicas

1. **Use Test Token** durante desenvolvimento para não gastar dinheiro
2. **Teste todos os fluxos:** sucesso, falha e pendente
3. **Monitore os logs** do backend para identificar problemas
4. **Configure notificações** no Mercado Pago para receber alertas de pagamentos

---

## ✅ Checklist de Configuração

- [ ] Conta no Mercado Pago criada
- [ ] Aplicação criada no painel do Mercado Pago
- [ ] Access Token obtido (Test ou Production)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado no Railway
- [ ] Webhook configurado no Mercado Pago
- [ ] Migration executada no banco de dados
- [ ] URLs de retorno configuradas
- [ ] Testado com cartão de teste
- [ ] Verificado que pagamentos estão sendo processados

---

**Pronto!** Seu sistema de pagamento está configurado! 🎉

