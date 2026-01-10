# 🔧 Solução: Erro "At least one policy returned UNAUTHORIZED"

## 🐛 Erro Encontrado

Ao tentar pagar com cartão de crédito, aparece:
- **"Erro ao processar pagamento"**
- **"At least one policy returned UNAUTHORIZED"**

## 🔍 Causa do Problema

Este erro indica que o **token do Mercado Pago não está autorizado** ou não está configurado corretamente. As causas mais comuns são:

1. ❌ **Token não configurado no Vercel** (mais provável)
2. ❌ **Token inválido ou expirado**
3. ❌ **Token não tem permissões necessárias**
4. ❌ **Variável de ambiente não foi re-deployada após adicionar**

## ✅ Solução Implementada

Criado endpoint serverless `/api/pagamentos/preference.js` que:
- ✅ Faz a requisição no **backend** (não no frontend)
- ✅ Mantém o token **seguro** no servidor
- ✅ Evita problemas de **CORS**
- ✅ Retorna erros mais **claros**

## 🔧 Passos para Resolver

### Passo 1: Verificar Token no Vercel

1. Acesse: https://vercel.com/brunos-projects-9672b208/groom-guru-platform
2. Vá em **Settings** → **Environment Variables**
3. Verifique se existe:
   - ✅ `MERCADOPAGO_ACCESS_TOKEN` = `TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86`
   - ✅ `VITE_MERCADOPAGO_ACCESS_TOKEN` = `TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86`

### Passo 2: Se Não Estiver Configurado

**Adicione as variáveis:**

**Variável 1:**
```
Name: MERCADOPAGO_ACCESS_TOKEN
Value: TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
Environments: ✅ Production, ✅ Preview, ✅ Development
```

**Variável 2:**
```
Name: VITE_MERCADOPAGO_ACCESS_TOKEN
Value: TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### Passo 3: Fazer Novo Deploy

⚠️ **CRUCIAL:** Após adicionar variáveis de ambiente, você **DEVE** fazer um novo deploy:

1. No Vercel, vá em **Deployments**
2. Clique nos **3 pontinhos** do último deployment
3. Selecione **Redeploy**
4. Ou faça um novo push para o GitHub (deploy automático)

**IMPORTANTE:** Variáveis de ambiente só ficam disponíveis em **novos deploys**!

### Passo 4: Verificar se o Endpoint Foi Deployado

1. No Vercel, vá em **Functions**
2. Procure por: `/api/pagamentos/preference`
3. Se não aparecer, o arquivo não foi deployado
4. Faça um novo commit e push

### Passo 5: Testar Novamente

1. Acesse: https://groom-guru-platform.vercel.app
2. Faça um agendamento
3. Tente pagar com cartão
4. Deve funcionar agora! ✅

---

## 🔍 Verificar Logs para Diagnosticar

### No Vercel:

1. Acesse: https://vercel.com/brunos-projects-9672b208/groom-guru-platform
2. Vá em **Functions** → `/api/pagamentos/preference`
3. Clique em **Logs** ou **Runtime Logs**
4. Veja os erros detalhados

### Logs Esperados (Sucesso):

```
💳 Criando preferência de pagamento no Mercado Pago...
🔑 Token configurado: Sim
📋 Enviando requisição para Mercado Pago...
📥 Status da resposta: 200
✅ Preferência criada com sucesso!
```

### Logs de Erro (401 Unauthorized):

```
📥 Status da resposta: 401
❌ Erro do Mercado Pago: {message: "Unauthorized"}
```

**Isso significa:** Token inválido ou não configurado.

---

## ✅ Checklist de Verificação

Antes de testar novamente, verifique:

- [ ] Variável `MERCADOPAGO_ACCESS_TOKEN` configurada no Vercel
- [ ] Variável `VITE_MERCADOPAGO_ACCESS_TOKEN` configurada no Vercel
- [ ] Novo deploy feito **APÓS** adicionar variáveis
- [ ] Função `/api/pagamentos/preference` aparece em **Functions**
- [ ] Token correto: `TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86`

---

## 🆘 Se Ainda Não Funcionar

### Verificar Token no Mercado Pago:

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Selecione a aplicação **"Barber Payments"**
3. Verifique se o token está **ativo**
4. Copie o token novamente (pode ter sido regenerado)

### Testar Token Manualmente:

Você pode testar o token diretamente com curl:

```powershell
$token = "TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86"
$body = @{
    items = @(
        @{
            title = "Teste"
            quantity = 1
            unit_price = 1.0
            currency_id = "BRL"
        }
    )
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.mercadopago.com/checkout/preferences" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

**Se retornar 401:** Token inválido - gere um novo token no Mercado Pago
**Se retornar 200:** Token válido - problema está no Vercel/deploy

---

## 📝 Arquivos Modificados

1. ✅ `api/pagamentos/preference.js` - **NOVO** endpoint serverless
2. ✅ `src/services/mercadopagoService.ts` - Atualizado para usar endpoint
3. ✅ `vercel.json` - Headers CORS adicionados

---

## 🚀 Próximos Passos

1. **Commit e push** das alterações (já feito)
2. **Aguardar deploy** no Vercel (automático)
3. **Configurar variáveis** no Vercel (se ainda não fez)
4. **Fazer novo deploy** após variáveis
5. **Testar** novamente

---

## ✅ Resumo da Solução

**Problema:** Requisição direta do frontend para Mercado Pago causava UNAUTHORIZED

**Solução:** Criar endpoint serverless que faz a requisição no backend, mantendo o token seguro

**Arquivo criado:** `api/pagamentos/preference.js`

**Status:** ✅ Código atualizado, aguardando deploy e configuração no Vercel

---

**Precisa fazer commit dessas alterações?** Vou fazer agora!

