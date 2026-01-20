# Como Testar o Resend Após Configuração

## ✅ Verificação Rápida

### 1. Verificar Logs do Railway

Após o deploy, verifique os logs do Railway:

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Clique no serviço do backend
4. Vá para a aba **"Deployments"**
5. Clique no deployment mais recente
6. Procure por estas linhas nos logs de inicialização:

```
🔍 [EMAIL SERVICE] Verificando Resend na inicialização...
   RESEND_API_KEY presente: true
   RESEND_API_KEY valor: re_XXXXX...
✅ [EMAIL] Resend configurado e pronto para uso
   API Key: re_XXXXX...
```

**✅ Se aparecer isso:** Resend está configurado corretamente!

**❌ Se aparecer:**
```
⚠️ [EMAIL] Resend não configurado
```

**Solução:**
- Verifique se a variável `RESEND_API_KEY` está configurada no Railway
- Verifique se o valor começa com `re_`
- Reinicie o serviço

### 2. Testar Recuperação de Senha

1. Acesse sua aplicação
2. Vá para a página de login
3. Clique em **"Esqueci minha senha"**
4. Digite um email válido que está cadastrado no sistema
5. Clique em **"Enviar"**

### 3. Verificar Logs Durante o Envio

Enquanto testa, monitore os logs do Railway em tempo real:

1. No Railway, vá para **"Deployments"**
2. Clique no deployment ativo
3. Veja os logs em tempo real

**Logs esperados (sucesso):**

```
📧 [EMAIL] INICIANDO ENVIO DE EMAIL DE RECUPERAÇÃO DE SENHA
📧 [EMAIL] ETAPA 1: Tentando enviar via Resend (timeout: 5s)...
   RESEND_API_KEY presente: true
   resendClient presente: true
   isResendConfigured(): true
📧 [EMAIL] Tentando enviar via Resend...
📧 [EMAIL] Enviando de: Barber Master <onboarding@resend.dev>
📧 [EMAIL] Enviando para: seu-email@exemplo.com
✅ [EMAIL] Email enviado via Resend com sucesso!
✅ [EMAIL] Email ID: [algum-id]
✅ [EMAIL] Email enviado com sucesso via Resend em XXXms!
```

**Se aparecer isso:** ✅ Email foi enviado com sucesso via Resend!

### 4. Verificar Caixa de Entrada

1. Verifique a **caixa de entrada** do email
2. Verifique a **pasta de spam/lixo eletrônico**
3. O email deve chegar em **1-3 segundos** (muito rápido!)

**Assunto do email:** `Recuperação de Senha - Barber Master`

**Remetente:** `Barber Master <onboarding@resend.dev>`

### 5. Verificar no Dashboard do Resend

1. Acesse: https://resend.com/emails
2. Faça login
3. Você verá todos os emails enviados
4. Pode verificar:
   - Status (enviado, entregue, etc.)
   - Tempo de envio
   - Destinatário

## ❌ Troubleshooting

### Problema: "Resend não configurado" nos logs

**Causa:** Variável não configurada ou valor incorreto

**Solução:**
1. No Railway, vá para **"Variables"**
2. Verifique se `RESEND_API_KEY` existe
3. Verifique se o valor começa com `re_`
4. Se não existir, adicione:
   - Name: `RESEND_API_KEY`
   - Value: `re_SUA_API_KEY_AQUI`
5. Reinicie o serviço

### Problema: "Domain is not verified"

**Causa:** Tentando usar domínio não verificado

**Solução:**
- Remova a variável `EMAIL_FROM` se existir
- O sistema usará automaticamente `onboarding@resend.dev`
- OU verifique seu domínio em https://resend.com/domains

### Problema: Email não chega

**Possíveis causas:**
1. Email não está cadastrado no sistema
2. Email está na pasta de spam
3. Problema com o provedor de email

**Solução:**
1. Verifique se o email está cadastrado
2. Verifique pasta de spam
3. Teste com outro email (Gmail, Outlook, etc.)
4. Verifique os logs do Railway para erros

### Problema: "Timeout" nos logs

**Causa:** Resend demorou mais de 5 segundos

**Solução:**
- Verifique sua conexão
- Verifique se a API Key está correta
- Tente novamente

### Problema: "403 Forbidden" ou "Unauthorized"

**Causa:** API Key inválida ou expirada

**Solução:**
1. No Resend, vá para: https://resend.com/api-keys
2. Crie uma nova API Key
3. Atualize no Railway:
   - Vá para "Variables"
   - Edite `RESEND_API_KEY`
   - Cole a nova API Key
4. Reinicie o serviço

## 📊 Monitoramento

### Ver Estatísticas no Resend

1. Acesse: https://resend.com
2. Vá para **"Dashboard"**
3. Veja:
   - Emails enviados hoje/mês
   - Taxa de entrega
   - Limite do plano

### Ver Logs no Railway

Os logs mostram:
- Tempo de envio (deve ser < 3 segundos)
- Método usado (Resend ou SMTP)
- Erros (se houver)

## ✅ Checklist de Verificação

- [ ] API Key configurada no Railway
- [ ] Logs mostram "Resend configurado"
- [ ] Teste de recuperação de senha funciona
- [ ] Email chega na caixa de entrada
- [ ] Email chega rápido (1-3 segundos)
- [ ] Logs mostram "Email enviado via Resend"

## 🎉 Pronto!

Se tudo estiver funcionando:
- ✅ Emails chegam em 1-3 segundos
- ✅ Logs mostram uso do Resend
- ✅ Emails aparecem no dashboard do Resend

**Parabéns! O Resend está configurado e funcionando!** 🚀
