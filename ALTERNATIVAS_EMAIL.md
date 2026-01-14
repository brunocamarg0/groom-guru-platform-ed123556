# 📧 Alternativas para Envio de Email (Além do SendGrid)

## ⚠️ Problema: Timeout com Outlook/Gmail

Se você está recebendo "Connection timeout" com Outlook ou Gmail, isso geralmente acontece porque o Railway bloqueia conexões SMTP de saída ou os provedores bloqueiam conexões do Railway.

## ✅ Soluções Alternativas

### 🔵 Opção 1: Resend (Mais Fácil - Recomendado)

**Resend** é um serviço moderno de email, muito fácil de configurar:

1. **Criar conta:**
   - Acesse: https://resend.com
   - Crie uma conta gratuita (3.000 emails/mês grátis)
   - Vá em **API Keys**
   - Clique em **Create API Key**
   - Copie a API Key

2. **Configurar no Railway:**
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=resend
   SMTP_PASS=sua-api-key-do-resend
   EMAIL_FROM="Groom Guru <onboarding@resend.dev>"
   ```

   **Nota:** Você precisa verificar um domínio no Resend primeiro, ou usar `onboarding@resend.dev` para testes.

---

### 🔵 Opção 2: Mailgun (Boa alternativa)

1. **Criar conta:**
   - Acesse: https://www.mailgun.com
   - Crie uma conta (5.000 emails/mês grátis)
   - Vá em **Sending** → **Domain Settings**
   - Copie as credenciais SMTP

2. **Configurar no Railway:**
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=postmaster@seu-dominio.mailgun.org
   SMTP_PASS=sua-senha-do-mailgun
   EMAIL_FROM="Groom Guru <noreply@seu-dominio.com>"
   ```

---

### 🔵 Opção 3: Resolver Timeout do Outlook

Se você quer continuar usando Outlook, tente estas configurações:

1. **No Railway, configure:**
   ```
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu-email@hotmail.com
   SMTP_PASS=sua-senha
   EMAIL_FROM="Groom Guru <seu-email@hotmail.com>"
   ```

2. **No Outlook/Hotmail:**
   - Acesse: https://account.microsoft.com/security
   - Ative "Acesso de aplicativo menos seguro" (se disponível)
   - Ou use "Senha de App" (similar ao Gmail)

3. **Se ainda não funcionar:**
   - Tente porta 25 (pode estar bloqueada no Railway)
   - Tente porta 465 com `SMTP_SECURE=true`
   - Use um serviço profissional (Resend, Mailgun)

---

### 🔵 Opção 4: Gmail com Senha de App

Se você quer usar Gmail:

1. **Criar Senha de App:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Se não aparecer, ative verificação em duas etapas primeiro
   - Selecione "Email" e "Outro (nome personalizado)"
   - Digite: "Groom Guru"
   - Copie a senha gerada (16 caracteres)

2. **Configurar no Railway:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   EMAIL_FROM="Groom Guru <seu-email@gmail.com>"
   ```

   **Nota:** Use a Senha de App (não sua senha normal do Gmail)

---

## 🎯 Recomendação Final

**Para produção, use Resend ou Mailgun:**
- ✅ Funcionam perfeitamente com Railway
- ✅ Não têm problemas de timeout
- ✅ São serviços profissionais de email
- ✅ Planos gratuitos generosos
- ✅ Fáceis de configurar

**Resend** é a opção mais fácil e moderna. **Mailgun** é uma alternativa sólida e confiável.

---

## 🔍 Verificar se Está Funcionando

Após configurar qualquer opção, verifique os logs do Railway:

**✅ Se estiver funcionando:**
```
📧 [EMAIL] Configurando SMTP real para produção
✅ [EMAIL] SMTP real configurado e verificado com sucesso
✅ [EMAIL] Email enviado via SMTP real
```

**❌ Se ainda tiver problemas:**
```
❌ [EMAIL] Timeout ao conectar ao servidor SMTP
❌ [EMAIL] Connection timeout
```

Nesse caso, tente outra opção da lista acima.

