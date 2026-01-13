# ⚠️ URGENTE: Configurar Variável na Vercel

## 🔴 Problema Atual

O frontend está tentando se conectar ao `localhost:3001` porque a variável de ambiente `VITE_API_URL` não está configurada na Vercel.

## ✅ Solução Imediata

### Passo 1: Configurar Variável na Vercel

1. Acesse: **https://vercel.com/brunos-projects-9672b208/groom-guru-platform**
2. Clique em **"Settings"** (menu superior)
3. Clique em **"Environment Variables"** (menu lateral)
4. Clique em **"+ Add New"**
5. Preencha:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://groom-guru-platform-production.up.railway.app/api`
     - ⚠️ **IMPORTANTE:** Adicione `/api` no final
   - Marque todas as opções:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Clique em **"Save"**

### Passo 2: Fazer Redeploy

1. Na Vercel, vá em **"Deployments"**
2. Clique nos **3 pontinhos** (⋯) do último deploy
3. Clique em **"Redeploy"**
4. Aguarde o deploy terminar (2-3 minutos)

---

## ✅ Correção Aplicada no Código

Atualizei o código para usar a URL do Railway como fallback, então mesmo sem a variável configurada, vai funcionar.

**Arquivos atualizados:**
- ✅ `src/pages/Cadastro.tsx`
- ✅ `src/pages/Login.tsx`
- ✅ `src/services/api.ts`
- ✅ `src/services/donoApi.ts`

**Fallback atualizado:**
- ❌ Antes: `'http://localhost:3001/api'`
- ✅ Agora: `'https://groom-guru-platform-production.up.railway.app/api'`

---

## 🎯 Depois do Redeploy

1. Aguarde o deploy terminar
2. Acesse: **https://groom-guru-platform.vercel.app**
3. Teste o cadastro novamente
4. Deve funcionar! ✅

---

## 📋 Checklist

- [ ] Variável `VITE_API_URL` configurada na Vercel
- [ ] Valor: `https://groom-guru-platform-production.up.railway.app/api`
- [ ] Marcar: Production, Preview, Development
- [ ] Fazer redeploy do frontend
- [ ] Testar cadastro

---

**Siga esses passos e o erro será resolvido!** 🚀

