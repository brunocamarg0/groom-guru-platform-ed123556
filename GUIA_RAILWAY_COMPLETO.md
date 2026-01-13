# 🚂 Guia Completo: Deploy no Railway (Recomendado)

## ✅ Por Que Railway?

**Para uma plataforma pública com crescimento exponencial:**

- ✅ **Gratuito para começar** ($5 créditos/mês)
- ✅ **Escala automaticamente** quando precisa
- ✅ **Sempre online** (não dorme)
- ✅ **Muito fácil** de configurar (5 minutos)
- ✅ **Deploy automático** do GitHub
- ✅ **Fácil migrar** para AWS depois quando crescer

---

## 🚀 Passo a Passo Completo

### 1. Criar Conta no Railway

1. Acesse: **https://railway.app**
2. Clique em **"Start a New Project"**
3. Faça login com **GitHub**
4. Autorize o Railway a acessar seus repositórios

### 2. Criar Novo Projeto

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório: `groom-guru-platform`
4. Railway vai detectar automaticamente

### 3. Configurar Deploy

1. Railway vai perguntar qual pasta usar
2. Selecione: **`backend`**
3. Railway vai:
   - Detectar `package.json`
   - Instalar dependências
   - Fazer build automaticamente
   - Iniciar com `npm start`

### 4. Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```env
DATABASE_URL=postgresql://postgres:1hoPO26EVLSTW5Uz@db.zozmkzcuulgwjbbpgple.supabase.co:5432/postgres
JWT_SECRET=c6cf108f-35cf-43b0-b065-56861713a158
SESSION_SECRET=c6cf108f-35cf-43b0-b065-56861713a158
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://groom-guru-platform.vercel.app
```

**Importante:** 
- Substitua `FRONTEND_URL` pela URL real do seu frontend na Vercel
- Todas as variáveis são necessárias!

### 5. Obter URL do Backend

1. No Railway, vá em **Settings** → **Networking**
2. Clique em **"Generate Domain"**
3. Copie a URL (ex: `https://groom-guru-backend.railway.app`)
4. **Anote essa URL!** Você vai precisar dela

### 6. Testar o Backend

Abra no navegador: `https://sua-url.railway.app/api/health`

Deve retornar:
```json
{
  "status": "API is running",
  "timestamp": "..."
}
```

### 7. Atualizar Frontend

**Opção A: Variável de Ambiente na Vercel**

1. Acesse: https://vercel.com/brunos-projects-9672b208/groom-guru-platform
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   ```
   VITE_API_URL=https://sua-url.railway.app/api
   ```
4. Marque para **Production**, **Preview** e **Development**
5. Faça um **Redeploy**

**Opção B: Atualizar Código**

Edite `src/services/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://sua-url.railway.app/api';
```

### 8. Fazer Deploy do Frontend

1. Push das alterações para GitHub
2. Vercel faz deploy automático
3. Frontend agora usa backend na nuvem!

---

## ✅ Pronto!

**Agora você tem:**
- ✅ Backend sempre online no Railway
- ✅ Frontend na Vercel
- ✅ Banco no Supabase
- ✅ **Não precisa rodar nada localmente!**

---

## 🎯 Teste Final

1. Acesse seu frontend: `https://groom-guru-platform.vercel.app`
2. Tente cadastrar uma barbearia
3. Deve funcionar! ✅

---

## 💰 Custo

**Railway Free Tier:**
- $5 créditos/mês grátis
- Suficiente para começar (até ~100 barbeiros)
- Quando crescer, paga apenas o que usar

**Quando escalar:**
- 100-500 barbeiros: ~$20-50/mês
- 500-1000 barbeiros: ~$50-100/mês
- 1000+ barbeiros: Migre para AWS (~$100-500/mês)

---

## 🚀 Próximos Passos (Quando Crescer)

1. **Adicionar CDN** (Cloudflare) - Acelera globalmente
2. **Otimizar banco** - Índices, cache
3. **Monitoramento** - Sentry, LogRocket
4. **Backup automático** - Railway faz isso
5. **Migrar para AWS** - Quando precisar de mais escala

---

## 📋 Checklist de Deploy

- [ ] Conta criada no Railway
- [ ] Projeto conectado ao GitHub
- [ ] Pasta `backend` selecionada
- [ ] Variáveis de ambiente configuradas
- [ ] URL do backend obtida
- [ ] Backend testado (`/api/health`)
- [ ] Frontend atualizado com URL do backend
- [ ] Variável `VITE_API_URL` configurada na Vercel
- [ ] Frontend redeployado
- [ ] Teste de cadastro funcionando

---

**Siga esses passos e seu backend estará online!** 🚀

