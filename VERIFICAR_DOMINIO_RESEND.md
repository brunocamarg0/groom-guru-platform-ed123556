# 📧 Como Verificar Domínio no Resend para Enviar Emails

## ⚠️ Problema Atual

O plano gratuito do Resend só permite enviar emails para o próprio email cadastrado (`brunocamargocontato@hotmail.com`). Para enviar para outros emails, você precisa verificar um domínio.

## ✅ Solução: Verificar Domínio no Resend

### Passo 1: Acessar o Resend

1. Acesse: https://resend.com
2. Faça login na sua conta
3. Vá em **"Domains"** no menu lateral

### Passo 2: Adicionar Domínio

1. Clique em **"Add Domain"**
2. Digite seu domínio (ex: `barbermaster.com` ou `seu-dominio.com`)
3. Clique em **"Add"**

### Passo 3: Configurar DNS

O Resend fornecerá registros DNS que você precisa adicionar no seu provedor de domínio:

#### Registros DNS Necessários:

1. **SPF Record** (TXT):
   ```
   v=spf1 include:_spf.resend.com ~all
   ```

2. **DKIM Record** (TXT):
   ```
   (O Resend fornecerá uma chave única)
   ```

3. **DMARC Record** (TXT) - Opcional:
   ```
   v=DMARC1; p=none;
   ```

### Passo 4: Adicionar Registros no Provedor de DNS

1. Acesse o painel do seu provedor de domínio (ex: GoDaddy, Namecheap, Cloudflare)
2. Vá em **"DNS Management"** ou **"Zone Records"**
3. Adicione os registros fornecidos pelo Resend
4. Aguarde a propagação DNS (pode levar de alguns minutos a 48 horas)

### Passo 5: Verificar no Resend

1. Volte ao Resend
2. Clique em **"Verify"** ao lado do domínio
3. Aguarde a verificação (geralmente alguns minutos)

### Passo 6: Configurar no Railway

Após verificar o domínio, configure no Railway:

1. Acesse o Railway: https://railway.app
2. Vá no seu serviço backend
3. Vá em **"Variables"**
4. Adicione ou atualize:
   ```
   EMAIL_FROM=Barber Master <noreply@seu-dominio.com>
   ```
   (Substitua `seu-dominio.com` pelo seu domínio verificado)

5. Faça um novo deploy

## 🔄 Alternativa: Usar SendGrid ou Mailgun

Se não tiver um domínio próprio, você pode usar outros serviços:

### SendGrid

1. Crie conta em: https://sendgrid.com
2. Verifique um email (não precisa de domínio próprio)
3. Configure no Railway:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=sua-api-key-do-sendgrid
   EMAIL_FROM=Barber Master <seu-email@exemplo.com>
   ```

### Mailgun

1. Crie conta em: https://mailgun.com
2. Use o domínio de teste fornecido (ou verifique seu domínio)
3. Configure no Railway:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@seu-dominio.mailgun.org
   SMTP_PASS=sua-senha-do-mailgun
   EMAIL_FROM=Barber Master <noreply@seu-dominio.mailgun.org>
   ```

## 🧪 Para Testes Imediatos

Se precisar testar AGORA sem verificar domínio:

1. Use o email cadastrado no Resend: `brunocamargocontato@hotmail.com`
2. Ou configure SendGrid/Mailgun para testes rápidos

## 📝 Checklist

- [ ] Domínio adicionado no Resend
- [ ] Registros DNS configurados
- [ ] Domínio verificado no Resend
- [ ] `EMAIL_FROM` configurado no Railway com domínio verificado
- [ ] Deploy realizado
- [ ] Teste de envio realizado

## ⚠️ Importante

- **Plano Gratuito Resend**: Limite de 3.000 emails/mês
- **SendGrid**: 100 emails/dia no plano gratuito
- **Mailgun**: 5.000 emails/mês no plano gratuito

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique os logs do Railway
2. Confirme que os registros DNS estão corretos
3. Aguarde a propagação DNS (pode levar até 48h)
4. Verifique se o domínio está realmente verificado no Resend
