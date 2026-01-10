# 🔧 Solução: Erro "At least one policy returned UNAUTHORIZED"

## ✅ Progresso Confirmado

O erro mudou de **"Token não configurado"** para **"UNAUTHORIZED"**!

Isso significa:
- ✅ Variáveis foram configuradas no Vercel
- ✅ Deploy foi feito
- ❌ Mas o token está sendo **rejeitado** pelo Mercado Pago

## 🔍 Possíveis Causas

### 1. Token Inválido ou Incorreto (Mais Provável)

**Problema:** Token copiado errado ou com espaços extras

**Solução:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Selecione a aplicação **"Barber Payments"**
3. Copie o Access Token novamente (sem espaços)
4. O token deve ser exatamente: `TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86`
5. Atualize no Vercel
6. Faça novo Redeploy

### 2. Token Foi Regenerado

**Problema:** Token pode ter sido regenerado no Mercado Pago

**Solução:**
1. Acesse o painel do Mercado Pago
2. Selecione "Barber Payments"
3. Verifique se o token mudou
4. Se mudou, copie o novo token
5. Atualize no Vercel
6. Faça novo Redeploy

### 3. Token Não Tem Permissões

**Problema:** Token pode não ter permissões para criar preferências

**Solução:**
1. No Mercado Pago, verifique as permissões do token
2. Certifique-se que tem permissão para criar preferências de pagamento
3. Se necessário, gere um novo token com todas as permissões

### 4. Token de TESTE Está Incorreto

**Problema:** Pode estar usando token de produção por engano

**Solução:**
- Token de TESTE deve começar com: `TEST-`
- Se começar com `APP_USR-`, é token de produção (não funciona em testes)
- Certifique-se que está usando o token correto

---

## 🔧 Passos para Resolver

### Passo 1: Verificar Token no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Selecione a aplicação **"Barber Payments"**
3. Procure por **Access Token** (Token de Acesso)
4. Copie o token **completamente** (sem espaços)

**Token esperado (TESTE):**
```
TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
```

### Passo 2: Verificar Token no Vercel

1. Acesse: https://vercel.com/brunos-projects-9672b208/groom-guru-platform
2. Vá em **Settings** → **Environment Variables**
3. Verifique se o token está **exatamente** como copiado:
   - ✅ Deve começar com `TEST-`
   - ✅ Sem espaços antes ou depois
   - ✅ Completo (51 caracteres)
4. Se estiver diferente, edite e corrija

### Passo 3: Testar Token Manualmente

Você pode testar o token diretamente:

**Opção 1: PowerShell**

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

try {
    $response = Invoke-WebRequest -Uri "https://api.mercadopago.com/checkout/preferences" `
      -Method POST `
      -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
      } `
      -Body $body
    
    Write-Host "✅ Token VÁLIDO! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Token INVÁLIDO! Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode
    Write-Host $_.ErrorDetails.Message
}
```

**Se retornar 401:** Token inválido - copie o token novamente no Mercado Pago
**Se retornar 200:** Token válido - problema está na configuração do Vercel

### Passo 4: Atualizar Token no Vercel

1. Se o token mudou, atualize no Vercel:
   - Edite a variável `MERCADOPAGO_ACCESS_TOKEN`
   - Cole o novo token
   - Salve
2. Repita para `VITE_MERCADOPAGO_ACCESS_TOKEN`

### Passo 5: Fazer Novo Redeploy

⚠️ **OBRIGATÓRIO:** Após atualizar o token, faça novo Redeploy!

1. No Vercel, vá em **Deployments**
2. Clique nos **3 pontinhos** do último deployment
3. Clique em **Redeploy** → **Production**
4. Aguarde o deploy terminar (2-3 minutos)

### Passo 6: Verificar Logs

1. Após o deploy, vá em **Functions** → `/api/pagamentos/preference`
2. Clique em **Logs**
3. Tente fazer um pagamento novamente
4. Veja os logs detalhados que adicionamos:
   - Status da resposta do Mercado Pago
   - Resposta completa do erro
   - Token usado (primeiros caracteres)

### Passo 7: Testar Novamente

1. Aguarde 2-3 minutos após o deploy
2. Acesse: https://groom-guru-platform.vercel.app
3. Faça um agendamento
4. Tente pagar com cartão
5. Deve funcionar! ✅

---

## 📋 Checklist de Verificação

Antes de testar novamente:

- [ ] Token verificado no Mercado Pago (aplicação "Barber Payments")
- [ ] Token copiado corretamente (sem espaços)
- [ ] Token começa com `TEST-` (token de teste)
- [ ] Token atualizado no Vercel (ambas variáveis)
- [ ] Novo Redeploy feito após atualizar token
- [ ] Logs verificados no Vercel
- [ ] Token testado manualmente (retorna 200)

---

## 🆘 Se Ainda Não Funcionar

### Verificar Logs Detalhados no Vercel:

1. Acesse: https://vercel.com/brunos-projects-9672b208/groom-guru-platform
2. Vá em **Functions** → `/api/pagamentos/preference`
3. Clique em **Logs**
4. Faça um pagamento e veja os logs

**Logs esperados (sucesso):**
```
✅ Token encontrado! Tamanho: 51 Prefixo: TEST-d450f022...
💳 Criando preferência de pagamento no Mercado Pago...
📥 Status da resposta: 200
✅ Preferência criada com sucesso!
```

**Logs de erro (401):**
```
✅ Token encontrado! Tamanho: 51 Prefixo: TEST-d450f022...
📥 Status da resposta: 401
❌ Erro do Mercado Pago: {message: "Unauthorized", ...}
```

### Verificar Token no Mercado Pago:

1. Certifique-se que está na aplicação **"Barber Payments"**
2. Verifique se o token está **ativo**
3. Se necessário, gere um novo token
4. Atualize no Vercel e faça novo deploy

### Outros Problemas Possíveis:

- **Token expirado:** Gere um novo token
- **Permissões insuficientes:** Verifique permissões do token
- **Aplicação errada:** Certifique-se que está na aplicação "Barber Payments"

---

## ✅ Pronto!

Após seguir todos os passos, especialmente **verificar o token no Mercado Pago** e **atualizar no Vercel**, deve funcionar!

**Lembre-se:** O token pode ter sido regenerado no Mercado Pago - sempre verifique o token atual!

