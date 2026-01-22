# Configurar Resend no Railway

Este guia mostra como configurar o Resend para envio rápido de emails no Railway.

## Por que usar Resend?

- ✅ **Muito mais rápido** que SMTP (1-3 segundos vs 5-10 segundos)
- ✅ **Mais confiável** - menos problemas de entrega
- ✅ **Plano gratuito** disponível (3.000 emails/mês)
- ✅ **Fácil de configurar** - apenas uma variável de ambiente

## Passo 1: Criar conta no Resend

1. Acesse: https://resend.com
2. Clique em **"Sign Up"** ou **"Get Started"**
3. Crie sua conta (pode usar email do Google/GitHub)
4. Confirme seu email

## Passo 2: Obter API Key

1. Após fazer login, vá para: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Dê um nome (ex: "Barber Master Production")
4. Selecione permissões: **"Sending access"** (envio de emails)
5. Clique em **"Add"**
6. **IMPORTANTE:** Copie a API Key imediatamente (ela só aparece uma vez!)
   - Formato: `re_XXXXXXXXXXXXXXXXXXXXXXXXXX`

## Passo 3: Configurar no Railway

### Opção A: Via Interface Web do Railway

1. Acesse: https://railway.app
2. Faça login e selecione seu projeto
3. Clique no serviço do backend (ex: "groom-guru-platform-production")
4. Vá para a aba **"Variables"**
5. Clique em **"+ New Variable"**
6. Configure:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Cole a API Key que você copiou (formato: `re_...`)
7. Clique em **"Add"**

### Opção B: Via Railway CLI

```bash
railway variables set RESEND_API_KEY=re_SUA_API_KEY_AQUI
```

## Passo 4: Verificar Configuração

1. No Railway, vá para **"Variables"**
2. Verifique se `RESEND_API_KEY` está presente
3. O valor deve começar com `re_`
4. **NÃO** precisa configurar `EMAIL_FROM` - o sistema usa o padrão do Resend

## Passo 5: Reiniciar o Serviço

Após adicionar a variável:

1. No Railway, vá para **"Deployments"**
2. Clique em **"Redeploy"** ou aguarde o deploy automático
3. Aguarde o deploy completar

## Passo 6: Verificar Logs

Após o deploy, verifique os logs:

1. No Railway, vá para **"Deployments"**
2. Clique no deployment mais recente
3. Procure por estas linhas nos logs:

```
✅ [EMAIL] Resend configurado e pronto para uso
   API Key: re_XXXXX...
```

Se aparecer:
```
⚠️ [EMAIL] Resend não configurado
```

Significa que a variável não foi configurada corretamente.

## Configuração Opcional: EMAIL_FROM

Por padrão, o sistema usa `Barber Master <onboarding@resend.dev>`.

**Para usar domínio próprio (opcional):**

1. No Resend, vá para: https://resend.com/domains
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Após verificar, configure no Railway:
   - **Name:** `EMAIL_FROM`
   - **Value:** `Barber Master <noreply@seudominio.com>`

**⚠️ IMPORTANTE:** No plano gratuito, você DEVE usar `onboarding@resend.dev` ou verificar seu domínio primeiro.

## Testar o Envio

1. Acesse a aplicação
2. Vá para "Esqueci minha senha"
3. Digite um email válido
4. Verifique os logs do Railway:
   - Deve aparecer: `✅ [EMAIL] Email enviado via Resend em Xms!`
5. Verifique a caixa de entrada do email (pode estar em spam)

## Troubleshooting

### Problema: "Resend não configurado"

**Solução:**
- Verifique se `RESEND_API_KEY` está configurada no Railway
- Verifique se o valor começa com `re_`
- Reinicie o serviço após adicionar a variável

### Problema: "Domain is not verified"

**Solução:**
- Use `onboarding@resend.dev` (padrão do plano gratuito)
- OU verifique seu domínio em https://resend.com/domains
- Remova a variável `EMAIL_FROM` se estiver configurada com domínio não verificado

### Problema: "Email não chega"

**Solução:**
- Verifique a pasta de spam
- Verifique os logs do Railway para erros
- Teste com outro email
- Verifique se o email está cadastrado no sistema

### Problema: "Timeout"

**Solução:**
- O sistema tem timeout de 5s para Resend
- Se demorar mais, verifique sua conexão
- Verifique se a API Key está correta

## Limites do Plano Gratuito

- ✅ 3.000 emails por mês
- ✅ 100 emails por dia
- ✅ Sempre use `onboarding@resend.dev` como remetente
- ✅ Suporte a todos os domínios de destino

## Próximos Passos

Após configurar:

1. ✅ Teste a recuperação de senha
2. ✅ Verifique se os emails chegam rapidamente (1-3 segundos)
3. ✅ Monitore os logs para garantir que está usando Resend
4. ✅ Se precisar de mais emails, considere upgrade no Resend

## Suporte

- Resend Docs: https://resend.com/docs
- Resend Status: https://status.resend.com
- Railway Docs: https://docs.railway.app




