# 📧 Como Configurar Email Real para Recuperação de Senha

## ⚠️ Problema Atual

O sistema está usando **Ethereal Email** (serviço de teste), que **NÃO envia emails reais**. Os emails só aparecem em https://ethereal.email para visualização.

## ⚠️ Problema de Timeout com Outlook/Gmail

Se você estiver recebendo erro "Connection timeout" ao usar Outlook ou Gmail, isso geralmente acontece porque:
- O Railway pode bloquear conexões SMTP de saída
- Provedores de email pessoais (Gmail, Outlook) podem bloquear conexões do Railway

**Solução:** Use SendGrid ou Mailgun (recomendado para produção) - eles são serviços profissionais de email que funcionam melhor com Railway.

## ✅ Solução: Configurar SMTP Real no Railway

### Passo 1: Acessar Railway

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Clique no serviço do **backend**
4. Vá em **"Variables"** (Variáveis de Ambiente)

### Passo 2: Adicionar Variáveis de Ambiente

Adicione as seguintes variáveis (escolha uma opção abaixo):

---

## 🔵 Opção 1: Gmail (Recomendado para começar)

### Configuração:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM="Groom Guru <seu-email@gmail.com>"
```

### ⚠️ IMPORTANTE para Gmail:

**NÃO use sua senha normal do Gmail!** Você precisa criar uma **"Senha de App"**:

1. Acesse: https://myaccount.google.com/apppasswords
2. Se não aparecer, ative a verificação em duas etapas primeiro
3. Selecione "Email" e "Outro (nome personalizado)"
4. Digite: "Groom Guru"
5. Clique em "Gerar"
6. Copie a senha gerada (16 caracteres, sem espaços)
7. Use essa senha no `SMTP_PASS`

---

## 🔵 Opção 2: Outlook/Hotmail

### Configuração:

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@hotmail.com
SMTP_PASS=sua-senha-normal
EMAIL_FROM="Groom Guru <seu-email@hotmail.com>"
```

**Nota:** Para Outlook, você pode usar sua senha normal, mas pode precisar ativar "Acesso de aplicativo menos seguro" nas configurações.

---

## 🔵 Opção 3: SendGrid (Recomendado para produção)

### Passo 1: Criar conta
1. Acesse: https://sendgrid.com
2. Crie uma conta gratuita (100 emails/dia grátis)
3. Vá em **Settings** → **API Keys**
4. Clique em **Create API Key**
5. Dê um nome (ex: "Groom Guru")
6. Selecione **Full Access** ou **Restricted Access** (com permissão de Mail Send)
7. Copie a API Key gerada

### Passo 2: Configurar no Railway

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua-api-key-do-sendgrid-aqui
EMAIL_FROM="Groom Guru <noreply@groomguru.com>"
```

**Nota:** O `SMTP_USER` deve ser literalmente `apikey` (não seu email).

---

## 🔵 Opção 4: Mailgun

### Passo 1: Criar conta
1. Acesse: https://www.mailgun.com
2. Crie uma conta (5.000 emails/mês grátis)
3. Vá em **Sending** → **Domain Settings**
4. Copie as credenciais SMTP

### Passo 2: Configurar no Railway

```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua-senha-do-mailgun
EMAIL_FROM="Groom Guru <noreply@seu-dominio.com>"
```

---

## ✅ Após Configurar

1. **Salve as variáveis no Railway**
2. **O Railway vai reiniciar automaticamente** (aguarde 1-2 minutos)
3. **Verifique os logs do Railway** - deve aparecer:
   ```
   📧 [EMAIL] Configurando SMTP real para produção
   📧 [EMAIL] Host: smtp.gmail.com (ou o que você configurou)
   ✅ [EMAIL] SMTP real configurado com sucesso
   ```

4. **Teste novamente a recuperação de senha**
5. **O email deve chegar na caixa de entrada real!**

---

## 🔍 Como Verificar se Está Funcionando

### ✅ Se estiver usando SMTP real:
- Logs mostram: `✅ [EMAIL] SMTP real configurado com sucesso`
- Logs mostram: `✅ [EMAIL] Email enviado via SMTP real`
- **Email chega na caixa de entrada**

### ❌ Se ainda estiver usando Ethereal:
- Logs mostram: `⚠️ [EMAIL] SMTP não configurado - usando Ethereal Email`
- Logs mostram: `⚠️ [EMAIL] Preview do email: https://ethereal.email/...`
- **Email NÃO chega na caixa de entrada**

---

## 🆘 Problemas Comuns

### "Erro ao enviar email"
- Verifique se as credenciais estão corretas
- Para Gmail, use Senha de App (não a senha normal)
- Verifique se a porta está correta (587 para TLS, 465 para SSL)
- Verifique se `SMTP_SECURE` está correto (false para 587, true para 465)

### "Email não chega"
- Verifique a pasta de spam/lixo eletrônico
- Verifique se o `EMAIL_FROM` está correto
- Teste enviando para outro email
- Verifique os logs do Railway para erros

### "Ainda aparece Ethereal"
- Verifique se as variáveis foram salvas no Railway
- Verifique se o Railway reiniciou após salvar
- Verifique os logs para ver qual SMTP está sendo usado
- Certifique-se de que `SMTP_HOST` e `SMTP_USER` estão configurados

---

## 📝 Exemplo Completo (Gmail)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seuemail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
EMAIL_FROM="Groom Guru <seuemail@gmail.com>"
```

**Lembre-se:** Para Gmail, `SMTP_PASS` deve ser a Senha de App (16 caracteres, pode ter espaços que serão ignorados).

---

**Após configurar, teste novamente a recuperação de senha e o email deve chegar!** 📧✅

