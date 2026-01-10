# 🔧 Guia Completo: Configuração Vercel + Webhook Mercado Pago

## 📋 Índice
1. [Configurar Variáveis de Ambiente no Vercel](#1-configurar-variáveis-de-ambiente-no-vercel)
2. [Fazer Deploy do Projeto](#2-fazer-deploy-do-projeto)
3. [Configurar Webhook no Mercado Pago](#3-configurar-webhook-no-mercado-pago)
4. [Testar o Sistema](#4-testar-o-sistema)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Configurar Variáveis de Ambiente no Vercel

### Passo 1.1: Acessar o Painel do Vercel

1. Acesse: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Faça login na sua conta
3. Selecione seu projeto **groom-guru-platform** (ou crie um novo projeto)

### Passo 1.2: Adicionar Variáveis de Ambiente

1. No painel do projeto, clique em **Settings** (Configurações)
2. No menu lateral, clique em **Environment Variables** (Variáveis de Ambiente)
3. Você verá uma seção para adicionar variáveis

### Passo 1.3: Adicionar Variável para Frontend (VITE)

1. Clique em **Add New** (Adicionar Nova)
2. Preencha:
   - **Name (Nome)**: `VITE_MERCADOPAGO_ACCESS_TOKEN`
   - **Value (Valor)**: `APP_USR-8198153225284103-071221-68070ac52617404b0cdf2c61202ce95c-2557085916`
   - **Environment (Ambiente)**: 
     - ✅ **Production** (Produção)
     - ✅ **Preview** (Preview)
     - ✅ **Development** (Desenvolvimento)
3. Clique em **Save** (Salvar)

### Passo 1.4: Adicionar Variável para Serverless Functions

1. Clique em **Add New** novamente
2. Preencha:
   - **Name (Nome)**: `MERCADOPAGO_ACCESS_TOKEN`
   - **Value (Valor)**: `APP_USR-8198153225284103-071221-68070ac52617404b0cdf2c61202ce95c-2557085916`
   - **Environment (Ambiente)**: 
     - ✅ **Production** (Produção)
     - ✅ **Preview** (Preview)
     - ✅ **Development** (Desenvolvimento)
3. Clique em **Save** (Salvar)

### ✅ Resultado Esperado:

Você deve ter **2 variáveis** configuradas:
- `VITE_MERCADOPAGO_ACCESS_TOKEN` (para frontend)
- `MERCADOPAGO_ACCESS_TOKEN` (para serverless functions)

---

## 2. Fazer Deploy do Projeto

### Passo 2.1: Preparar o Projeto

1. Certifique-se de que todos os arquivos estão commitados:
   ```bash
   git add .
   git commit -m "feat: implementa integração Mercado Pago"
   git push origin main
   ```

### Passo 2.2: Fazer Deploy no Vercel

**Opção A: Via GitHub (Recomendado)**

1. Se seu projeto ainda não está conectado ao Vercel:
   - No painel do Vercel, clique em **Add New Project** (Adicionar Novo Projeto)
   - Conecte seu repositório GitHub
   - Selecione o repositório `groom-guru-platform`
   - Clique em **Import**

2. O Vercel detectará automaticamente que é um projeto Vite/React

3. Configure as seguintes opções:
   - **Framework Preset**: Vite (deve detectar automaticamente)
   - **Root Directory**: `./` (raiz)
   - **Build Command**: `npm run build` (já configurado)
   - **Output Directory**: `dist` (já configurado)
   - **Install Command**: `npm install` (já configurado)

4. Clique em **Deploy** (Fazer Deploy)

5. Aguarde o build completar (pode levar 1-3 minutos)

**Opção B: Via CLI do Vercel**

1. Instale o Vercel CLI (se ainda não tiver):
   ```bash
   npm install -g vercel
   ```

2. No terminal, navegue até a raiz do projeto:
   ```bash
   cd C:\Users\bruno\OneDrive\Documents\groom-guru-platform-main
   ```

3. Faça login no Vercel:
   ```bash
   vercel login
   ```

4. Faça o deploy:
   ```bash
   vercel
   ```

5. Siga as instruções na tela:
   - Confirme o nome do projeto
   - Confirme as configurações
   - Aguarde o deploy

### Passo 2.3: Verificar o Deploy

1. Após o deploy, você receberá uma URL como: `https://groom-guru-platform.vercel.app`
2. Copie esta URL - você precisará dela para configurar o webhook

### ✅ Resultado Esperado:

- ✅ Projeto deployado no Vercel
- ✅ URL de produção disponível (ex: `https://seu-projeto.vercel.app`)
- ✅ Variáveis de ambiente configuradas

---

## 3. Configurar Webhook no Mercado Pago

### Passo 3.1: Acessar o Painel do Mercado Pago

1. Acesse: [https://www.mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel)
2. Faça login na sua conta de desenvolvedor
3. Certifique-se de estar na **aplicação correta** (que possui o Access Token configurado)

### Passo 3.2: Criar Webhook

1. No menu lateral, clique em **Webhooks** (ou **Notificações**)
2. Clique em **Criar Webhook** ou **Adicionar Webhook**
3. Você verá um formulário para configurar o webhook

### Passo 3.3: Configurar o Webhook

Preencha os campos:

**URL do Webhook:**
```
https://seu-projeto.vercel.app/api/pagamentos/webhook
```
⚠️ **IMPORTANTE**: Substitua `seu-projeto.vercel.app` pela URL real do seu projeto no Vercel!

**Exemplo:**
```
https://groom-guru-platform.vercel.app/api/pagamentos/webhook
```

**Eventos para Escutar:**
- ✅ **Pagamentos (Payments)**
- ✅ Marque: `payment.created`
- ✅ Marque: `payment.updated`
- ✅ Marque: `payment.approved`
- ✅ Marque: `payment.rejected`

**Versão da API:**
- Selecione a versão mais recente disponível (geralmente `v1` ou a mais recente)

**Estado (Status):**
- ✅ **Ativo** (Active)

### Passo 3.4: Salvar o Webhook

1. Revise todas as configurações
2. Clique em **Salvar** ou **Criar Webhook**
3. O Mercado Pago tentará fazer uma requisição de teste (POST) para sua URL
4. Se a URL estiver correta, você verá um status **200 OK** ou **Teste bem-sucedido**

### Passo 3.5: Verificar Status do Webhook

1. Na lista de webhooks, você verá o webhook criado
2. Verifique o **Status**:
   - 🟢 **Ativo** = Funcionando corretamente
   - 🟡 **Pendente** = Aguardando verificação
   - 🔴 **Inativo** = Erro na URL ou autenticação

### ✅ Resultado Esperado:

- ✅ Webhook criado e ativo no Mercado Pago
- ✅ URL configurada: `https://seu-projeto.vercel.app/api/pagamentos/webhook`
- ✅ Eventos de pagamento configurados

---

## 4. Testar o Sistema

### Passo 4.1: Testar Deploy

1. Acesse sua URL do Vercel: `https://seu-projeto.vercel.app`
2. Verifique se o site está funcionando
3. Faça login como cliente (qualquer email/senha funciona no modo mock)

### Passo 4.2: Testar Agendamento e Checkout

1. Vá em **Novo Agendamento**
2. Selecione:
   - Barbearia
   - Serviço
   - Data e hora
3. Clique em **Continuar para Pagamento**
4. Você será redirecionado para o checkout

### Passo 4.3: Testar Pagamento com Cartão

**⚠️ ATENÇÃO: Este é um token de PRODUÇÃO - pagamentos são REAIS!**

1. No checkout, selecione **Cartão de Crédito**
2. Clique em **Finalizar Pagamento**
3. Você será redirecionado para o checkout do Mercado Pago
4. Use um cartão de teste ou real:
   - **Para teste REAL**: Use qualquer cartão real (será debitado)
   - **Para teste SEGURO**: Use token de teste do Mercado Pago primeiro

5. Complete o pagamento no Mercado Pago
6. Você será redirecionado para: `/client/pagamento/sucesso`

### Passo 4.4: Testar PIX

1. No checkout, selecione **PIX**
2. Clique em **Gerar QR Code PIX**
3. Um QR Code será exibido
4. Escaneie com o app do seu banco
5. Faça o pagamento (ou simule)
6. O webhook será chamado automaticamente quando o pagamento for confirmado

### Passo 4.5: Verificar Webhook

1. No painel do Mercado Pago, vá em **Webhooks**
2. Clique no webhook criado
3. Veja o histórico de eventos:
   - Você deve ver requisições POST sendo recebidas
   - Status `200 OK` significa que funcionou

4. No Vercel, vá em **Functions** (Serverless Functions)
5. Clique em `/api/pagamentos/webhook`
6. Veja os logs de execução:
   - Você deve ver logs como: `📥 Webhook recebido do Mercado Pago`

### ✅ Resultado Esperado:

- ✅ Site funcionando no Vercel
- ✅ Checkout funcionando
- ✅ Redirecionamento para Mercado Pago funcionando
- ✅ Webhook recebendo requisições
- ✅ Status de pagamento atualizando corretamente

---

## 5. Troubleshooting (Solução de Problemas)

### Problema 1: Variáveis de Ambiente Não Funcionam

**Sintoma:** Erro `Token do Mercado Pago não configurado`

**Solução:**
1. Verifique se as variáveis foram adicionadas corretamente no Vercel
2. Certifique-se de que marcou todos os ambientes (Production, Preview, Development)
3. **Re-faça o deploy** após adicionar variáveis de ambiente
4. As variáveis só ficam disponíveis em novos deploys

### Problema 2: Webhook Não Recebe Requisições

**Sintoma:** Nenhuma requisição aparece no histórico do webhook

**Solução:**
1. Verifique se a URL está correta:
   - Deve ser: `https://seu-projeto.vercel.app/api/pagamentos/webhook`
   - **Não use** `www.` na URL do Vercel
   - **Use** `https://` (não `http://`)
   
2. Verifique se a função está deployada:
   - No Vercel, vá em **Functions**
   - Procure por `/api/pagamentos/webhook`
   - Se não aparecer, verifique se o arquivo está em `api/pagamentos/webhook.js`

3. Teste a URL manualmente:
   ```bash
   curl -X POST https://seu-projeto.vercel.app/api/pagamentos/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"123"}}'
   ```

### Problema 3: Erro 404 na API

**Sintoma:** `404 Not Found` ao chamar `/api/pagamentos/pix`

**Solução:**
1. Verifique se os arquivos estão na pasta correta:
   ```
   api/
     pagamentos/
       pix.js
       webhook.js
   ```

2. Verifique o arquivo `vercel.json`:
   - Deve ter a configuração de rewrites

3. Re-faça o deploy

### Problema 4: CORS ou Erro de Origem

**Sintoma:** Erro de CORS ao fazer requisições

**Solução:**
1. No Vercel, as serverless functions já lidam com CORS automaticamente
2. Se houver problema, adicione headers CORS no arquivo `api/pagamentos/pix.js`:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'POST');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   ```

### Problema 5: Token Não Funciona

**Sintoma:** `401 Unauthorized` ou `Token inválido`

**Solução:**
1. Verifique se o token está correto:
   - Deve começar com `APP_USR-`
   - Copie e cole novamente do painel do Mercado Pago

2. Verifique se está usando o token correto:
   - Token de produção vs token de teste
   - Token da aplicação correta

3. Regenerar token se necessário:
   - No Mercado Pago, vá em **Credentials**
   - Gere um novo token se necessário

### Problema 6: PIX Não Gera QR Code

**Sintoma:** Erro ao gerar QR Code PIX

**Solução:**
1. Verifique se a serverless function `/api/pagamentos/pix` está funcionando
2. Verifique os logs no Vercel:
   - Vá em **Functions** → `/api/pagamentos/pix` → **Logs**
   - Procure por erros

3. Verifique se o token tem permissões para criar pagamentos PIX
4. Teste com um valor mínimo (R$ 0,01 ou R$ 1,00)

---

## 📋 Checklist Final

Antes de considerar tudo configurado, verifique:

### Vercel:
- [ ] Variável `VITE_MERCADOPAGO_ACCESS_TOKEN` configurada
- [ ] Variável `MERCADOPAGO_ACCESS_TOKEN` configurada
- [ ] Projeto deployado com sucesso
- [ ] URL de produção funcionando
- [ ] Serverless functions aparecem em **Functions**

### Mercado Pago:
- [ ] Webhook criado e ativo
- [ ] URL do webhook correta
- [ ] Eventos de pagamento configurados
- [ ] Teste do webhook bem-sucedido

### Sistema:
- [ ] Site carrega normalmente
- [ ] Agendamento funciona
- [ ] Checkout redireciona para Mercado Pago
- [ ] Retorno de pagamento funciona (sucesso/falha/pendente)
- [ ] Webhook recebe e processa eventos

---

## 🆘 Precisa de Ajuda?

- **Vercel Support**: [https://vercel.com/support](https://vercel.com/support)
- **Mercado Pago Docs**: [https://www.mercadopago.com.br/developers/pt/docs](https://www.mercadopago.com.br/developers/pt/docs)
- **Mercado Pago Support**: [https://www.mercadopago.com.br/developers/support](https://www.mercadopago.com.br/developers/support)

---

## ✅ Pronto!

Após seguir todos os passos, seu sistema de pagamento real estará funcionando!

**Lembre-se:**
- ⚠️ Este é um token de **PRODUÇÃO** - pagamentos são **REAIS**
- 🧪 Teste primeiro com valores pequenos (R$ 1,00)
- 📊 Monitore os logs no Vercel e Mercado Pago
- 🔔 Configure alertas no Mercado Pago para receber notificações

**Boa sorte! 🚀**

