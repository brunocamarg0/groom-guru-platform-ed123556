# ⚡ Guia Rápido: Configurar Token no Vercel

## ❌ Problema Confirmado

Os logs confirmam que as variáveis **NÃO estão configuradas**:
```
MERCADOPAGO_ACCESS_TOKEN: ❌ Não configurado
VITE_MERCADOPAGO_ACCESS_TOKEN: ❌ Não configurado
Todas variáveis MERCADO: [] (vazio)
```

## ✅ Solução Rápida (5 minutos)

### Passo 1: Acessar Vercel
1. Abra: https://vercel.com/brunos-projects-9672b208/groom-guru-platform
2. Faça login

### Passo 2: Ir para Environment Variables
1. Clique em **Settings** (no topo da página)
2. No menu lateral esquerdo, clique em **Environment Variables**

### Passo 3: Adicionar Primeira Variável
1. Clique em **"Add New"** ou **"Adicionar Nova"**
2. Preencha:

   **Name:**
   ```
   MERCADOPAGO_ACCESS_TOKEN
   ```

   **Value:**
   ```
   TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
   ```

   **Environments:** Marque **TODOS**:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

3. Clique em **Save**

### Passo 4: Adicionar Segunda Variável
1. Clique em **"Add New"** novamente
2. Preencha:

   **Name:**
   ```
   VITE_MERCADOPAGO_ACCESS_TOKEN
   ```

   **Value:**
   ```
   TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
   ```

   **Environments:** Marque **TODOS**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

3. Clique em **Save**

### Passo 5: Verificar se Foi Salvo
Você deve ver uma lista com **2 variáveis**:

```
MERCADOPAGO_ACCESS_TOKEN        Production, Preview, Development
VITE_MERCADOPAGO_ACCESS_TOKEN   Production, Preview, Development
```

Se aparecer assim, está correto! ✅

### Passo 6: Fazer Redeploy ⚠️ OBRIGATÓRIO!

**IMPORTANTE:** Variáveis só funcionam em novos deploys!

1. No topo da página, clique em **Deployments**
2. Encontre o deployment mais recente (primeiro da lista)
3. Clique nos **3 pontinhos** (⋯) à direita desse deployment
4. Clique em **Redeploy**
5. Clique em **Redeploy** novamente para confirmar
6. Aguarde o deploy terminar (2-3 minutos)

### Passo 7: Testar
1. Aguarde **2-3 minutos** após o deploy terminar
2. Acesse: https://groom-guru-platform.vercel.app/api/pagamentos/test-token
3. Deve aparecer: `"MERCADOPAGO_ACCESS_TOKEN": "✅ Configurado"`

---

## 📋 Valores para Copiar e Colar

### Variável 1
**Name:**
```
MERCADOPAGO_ACCESS_TOKEN
```

**Value:**
```
TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
```

### Variável 2
**Name:**
```
VITE_MERCADOPAGO_ACCESS_TOKEN
```

**Value:**
```
TEST-d450f022-fc2f-4ae2-8629-e5f723e5cf86
```

---

## ⚠️ Pontos Importantes

1. **Nome exato:** Copie os nomes exatamente como mostrado (maiúsculas, underscore)
2. **Valor exato:** Copie o token sem espaços antes ou depois
3. **Ambientes:** Marque **TODOS** (Production, Preview, Development)
4. **Redeploy:** **SEMPRE** faça redeploy após adicionar variáveis
5. **Aguardar:** Aguarde 2-3 minutos após deploy para testar

---

## 🆘 Se Não Funcionar

Verifique:
- [ ] Nome da variável está **exatamente** como mostrado?
- [ ] Valor do token está correto (sem espaços)?
- [ ] Ambientes marcados: Production, Preview, Development?
- [ ] Variáveis foram salvas (aparecem na lista)?
- [ ] Redeploy foi feito **APÓS** adicionar variáveis?
- [ ] Aguardou 2-3 minutos após deploy terminar?

---

## ✅ Pronto!

Após seguir todos os passos, especialmente o **Redeploy**, deve funcionar!

**Teste novamente:** https://groom-guru-platform.vercel.app/api/pagamentos/test-token

