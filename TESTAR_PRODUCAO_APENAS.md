# 🚀 Testar Painel do Dono - Apenas Produção

## 📊 Ambiente de Produção

- **Backend:** Railway (`https://groom-guru-platform-production.up.railway.app`)
- **Frontend:** Vercel (`https://groom-guru-platform.vercel.app`)
- **API URL:** `https://groom-guru-platform-production.up.railway.app/api`

---

## ✅ PASSO 1: Verificar se Backend Railway está Online

### 1.1. Testar Health Check

**Abra no navegador:**
```
https://groom-guru-platform-production.up.railway.app/api/health
```

**Resultado esperado:**
```json
{
  "status": "API is running",
  "timestamp": "...",
  "environment": "production"
}
```

**✅ Se funcionar:** Backend está online!
**❌ Se não funcionar:** Backend pode estar offline - verificar Railway

---

### 1.2. Verificar Status no Railway

1. Acesse: https://railway.app
2. Vá para o projeto **groom-guru-platform-production**
3. Verifique se o serviço está **"Active"** (verde)

**Se estiver "Crashed" ou "Failed":**
- Clique em **Logs** para ver erros
- Verifique **Variables** (variáveis de ambiente)
- Verifique **Deployments** (último deploy)

---

## ✅ PASSO 2: Verificar Configuração no Railway

### 2.1. Verificar Variáveis de Ambiente

No Railway, vá em **Variables** e verifique se TODAS existem:

- [ ] **DATABASE_URL** - URL do banco Supabase
- [ ] **JWT_SECRET** - Token para JWT
- [ ] **SESSION_SECRET** - Token para sessões
- [ ] **NODE_ENV** = `production`
- [ ] **PORT** = `3001`
- [ ] **FRONTEND_URL** = `https://groom-guru-platform.vercel.app`

**⚠️ IMPORTANTE:** `FRONTEND_URL` é essencial para CORS funcionar!

**Se alguma estiver faltando:**
1. Clique em **"+ New Variable"**
2. Adicione a variável
3. Salve
4. Railway vai fazer redeploy automaticamente

---

### 2.2. Verificar Root Directory

1. No Railway, vá em **Settings** → **Service**
2. Role até **"Root Directory"**
3. Deve estar: `backend`
4. Se estiver vazio ou errado:
   - Digite: `backend`
   - Salve
   - Railway vai fazer deploy

---

## ✅ PASSO 3: Verificar Configuração na Vercel

### 3.1. Verificar Variável VITE_API_URL

1. Acesse: https://vercel.com
2. Vá para o projeto **groom-guru-platform**
3. Vá em **Settings** → **Environment Variables**
4. Procure por: `VITE_API_URL`
5. Valor deve ser: `https://groom-guru-platform-production.up.railway.app/api`
6. Marque: ✅ Production, ✅ Preview, ✅ Development

**Se não existir ou estiver errado:**
1. Clique em **"+ Add New"**
2. Name: `VITE_API_URL`
3. Value: `https://groom-guru-platform-production.up.railway.app/api`
4. Marque todas as opções (Production, Preview, Development)
5. Clique em **Save**

---

### 3.2. Redeploy do Frontend

**Após adicionar/alterar variável:**

1. Na Vercel, vá em **Deployments**
2. Clique nos **3 pontinhos** (⋯) do último deploy
3. Clique em **"Redeploy"**
4. Aguarde terminar (2-3 minutos)

**OU**

1. Faça um commit vazio no GitHub
2. Vercel vai fazer deploy automaticamente

---

## ✅ PASSO 4: Testar Login e Autenticação

### 4.1. Acessar Frontend

**Acesse:**
```
https://groom-guru-platform.vercel.app
```

---

### 4.2. Fazer Login

1. Clique em **"Login"** ou acesse: `https://groom-guru-platform.vercel.app/login`
2. Use credenciais de um dono cadastrado
3. Clique em **"ENTRAR"**

**Verificar:**
- ✅ Login funcionou?
- ✅ Redirecionou para `/dono`?
- ✅ Token foi salvo? (F12 → Application → Local Storage → token)

**Se der erro:**
- Abra F12 → Console
- Veja qual erro aparece
- Verifique se backend está online (PASSO 1)
- Verifique CORS (se erro de CORS, verificar `FRONTEND_URL` no Railway)

---

## ✅ PASSO 5: Testar Dashboard do Dono

### 5.1. Acessar Dashboard

1. Após login, você deve estar em: `https://groom-guru-platform.vercel.app/dono`
2. Se não estiver, clique no menu e vá para **"Dashboard"**
3. Abra o Console (F12 → Console)

**Verificar logs:**
- ✅ `🔄 Carregando dados do banco para barbeariaId: ...`
- ✅ `📥 Iniciando carregamento de dados do banco de dados...`
- ✅ `✅ Dados carregados do banco:`

**Verificar requisições (F12 → Network):**
- ✅ Requisição para `/api/dono/dashboard/kpis`?
- ✅ Status 200 (sucesso)?
- ✅ Dados retornando?

---

### 5.2. Verificar KPIs

**Deve aparecer:**
- ✅ Faturamento Hoje
- ✅ Agendamentos Hoje
- ✅ Cancelamentos
- ✅ Nota Média
- ✅ Faturamento Semana
- ✅ Faturamento Mês
- ✅ Clientes Recorrentes

**Se aparecerem zeros:**
- Normal se não houver dados no banco ainda
- Vamos criar dados de teste depois

---

## ✅ PASSO 6: Testar Funcionalidades CRUD

### 6.1. Testar Criar Profissional

1. No menu, clique em **"Gestão de Profissionais"**
2. Clique em **"Adicionar Profissional"**
3. Preencha o formulário:
   - Nome: "João Barbeiro"
   - Telefone: "(11) 99999-9999"
   - Email: "joao@teste.com"
   - Especialidades: ["Corte", "Barba"]
   - Comissão: 40%
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Profissional foi criado?
- ✅ Aparece na lista?
- ✅ Console mostra sucesso? (F12 → Console)
- ✅ Requisição POST para `/api/dono/profissionais` com status 200? (F12 → Network)

**Se der erro:**
- Verificar console (F12)
- Verificar se token está sendo enviado (F12 → Network → Headers → Authorization)
- Verificar logs do Railway

---

### 6.2. Testar Criar Cliente

1. No menu, clique em **"Gestão de Clientes"**
2. Clique em **"Novo Cliente"**
3. Preencha:
   - Nome: "Pedro Silva"
   - Telefone: "(11) 88888-8888"
   - Email: "pedro@teste.com"
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Cliente foi criado?
- ✅ Aparece na lista?

---

### 6.3. Testar Criar Serviço

1. No menu, clique em **"Gestão de Serviços"**
2. Clique em **"Adicionar Serviço"**
3. Preencha:
   - Nome: "Corte Masculino"
   - Preço: R$ 30,00
   - Duração: 40 minutos
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Serviço foi criado?
- ✅ Aparece na lista?

---

## ✅ PASSO 7: Testar Funcionalidades de Agendamento

### 7.1. Criar Agendamento

1. No menu, clique em **"Agenda Inteligente"**
2. Clique em **"Novo Agendamento"**
3. Preencha:
   - Cliente: Selecione um cliente (criado no passo 6.2)
   - Profissional: Selecione um profissional (criado no passo 6.1)
   - Serviço: Selecione um serviço (criado no passo 6.3)
   - Data: Hoje
   - Horário: 14:00
4. Clique em **"Salvar"**

**Verificar:**
- ✅ Agendamento foi criado?
- ✅ Aparece na agenda?
- ✅ Status é "pendente"?

---

### 7.2. Confirmar Agendamento

1. Encontre um agendamento com status "pendente"
2. Clique em **"Confirmar"**

**Verificar:**
- ✅ Status mudou para "confirmado"?
- ✅ Atualizou na tela?
- ✅ Requisição PUT para `/api/agendamentos/{id}/confirmar` com status 200?

---

### 7.3. Recusar Agendamento

1. Encontre um agendamento com status "pendente"
2. Clique em **"Recusar"**
3. Informe motivo (opcional)
4. Clique em **"Confirmar"**

**Verificar:**
- ✅ Status mudou para "recusado"?
- ✅ Atualizou na tela?

---

## 🆘 Problemas Comuns e Soluções

### Problema: "Failed to fetch" ou "Network error"

**Causas possíveis:**
1. Backend Railway está offline
2. CORS bloqueando
3. URL da API está errada

**Solução:**
1. Verificar se backend está online: `https://groom-guru-platform-production.up.railway.app/api/health`
2. Verificar `FRONTEND_URL` no Railway (deve ser `https://groom-guru-platform.vercel.app`)
3. Verificar `VITE_API_URL` na Vercel

---

### Problema: "Token inválido" ou 401

**Causas possíveis:**
1. JWT_SECRET não configurado no Railway
2. Token expirado
3. Token não está sendo enviado

**Solução:**
1. Verificar `JWT_SECRET` no Railway (Variables)
2. Fazer logout e login novamente
3. Verificar se token está no localStorage (F12 → Application → Local Storage → token)
4. Verificar se Authorization header está sendo enviado (F12 → Network → Headers)

---

### Problema: "CORS error"

**Causa:**
- `FRONTEND_URL` não está configurado no Railway ou está errado

**Solução:**
1. No Railway, vá em **Variables**
2. Verifique se existe `FRONTEND_URL`
3. Valor deve ser: `https://groom-guru-platform.vercel.app`
4. Se não existir, adicione
5. Railway vai fazer redeploy automaticamente
6. Aguarde 1-2 minutos

---

### Problema: KPIs aparecem como zero

**Causa:**
- Normal se não houver dados no banco

**Solução:**
- Criar dados de teste:
  1. Criar alguns profissionais (PASSO 6.1)
  2. Criar alguns clientes (PASSO 6.2)
  3. Criar alguns serviços (PASSO 6.3)
  4. Criar alguns agendamentos (PASSO 7.1)
  5. Confirmar alguns agendamentos (PASSO 7.2)
  6. Recarregar dashboard (F5)

---

## 📋 Checklist de Testes

Marque conforme testa:

### Configuração:
- [ ] Backend Railway está online (`/api/health` responde)
- [ ] Frontend Vercel acessível
- [ ] `VITE_API_URL` configurado na Vercel
- [ ] `FRONTEND_URL` configurado no Railway
- [ ] Todas as variáveis no Railway estão preenchidas

### Funcionalidades:
- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] KPIs aparecendo (mesmo que zeros)
- [ ] Criar profissional funcionando
- [ ] Criar cliente funcionando
- [ ] Criar serviço funcionando
- [ ] Criar agendamento funcionando
- [ ] Confirmar agendamento funcionando
- [ ] Recusar agendamento funcionando

---

## 🎯 Próximos Passos

**Se tudo estiver funcionando:**
1. ✅ Testar outras funcionalidades (editar, remover, etc)
2. ✅ Adicionar mais dados de teste
3. ✅ Verificar se KPIs atualizam com dados reais
4. ✅ Testar todas as páginas do painel

**Se algo não funcionar:**
- Me avise qual funcionalidade
- Me envie o erro do console (F12 → Console)
- Me envie a requisição que falhou (F12 → Network → clique na requisição)
- Me envie os logs do Railway (Railway → Logs → copiar últimas linhas)

---

## 💡 Dicas

**Para ver requisições em tempo real:**
- Abra F12 → Network
- Filtre por "XHR" ou "Fetch"
- Veja todas as requisições sendo feitas
- Clique em uma requisição para ver:
  - **Headers** (verificar Authorization)
  - **Payload** (dados enviados)
  - **Response** (resposta do servidor)

**Para ver logs do backend:**
- Acesse Railway → Logs
- Veja os logs em tempo real
- Procure por erros (linhas com "Error" ou "❌")

**Para ver logs do frontend:**
- Abra F12 → Console
- Veja mensagens de log e erros
- Procure por requisições que falharam

---

## 🔗 Links Úteis

- **Backend Health:** https://groom-guru-platform-production.up.railway.app/api/health
- **Frontend:** https://groom-guru-platform.vercel.app
- **Railway:** https://railway.app
- **Vercel:** https://vercel.com

---

**Agora é só testar em produção! Me avise o que aconteceu! 🚀**
