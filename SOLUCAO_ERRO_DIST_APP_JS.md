# 🔧 Solução: Erro "Cannot find module '/app/dist/app.js'"

## ⚠️ Problema

O Railway está tentando executar `node dist/app.js`, mas o arquivo não existe porque:
1. O build do TypeScript não está sendo executado corretamente
2. O Railway está executando os comandos no diretório errado
3. O build está falhando silenciosamente

## ✅ Solução: Configurar Root Directory no Railway

O Railway precisa saber que o backend está na pasta `backend/`. Siga estes passos:

### Passo 1: Configurar Root Directory no Railway

1. **Acesse o Railway:**
   - Vá para: https://railway.app
   - Selecione seu projeto
   - Clique no serviço do **backend**

2. **Configure o Root Directory:**
   - No menu lateral, vá em **"Settings"** (Configurações)
   - Procure por **"Root Directory"** ou **"Working Directory"**
   - Defina como: `backend`
   - Salve as alterações

3. **Ou via Railway Dashboard:**
   - No serviço do backend
   - Vá em **"Settings"** → **"Deploy"**
   - Em **"Root Directory"**, digite: `backend`
   - Salve

### Passo 2: Verificar Configuração

Após configurar, o Railway deve:
- Executar `npm install` dentro de `backend/`
- Executar `npm run build` dentro de `backend/`
- Gerar `backend/dist/app.js`
- Executar `npm start` dentro de `backend/`

### Passo 3: Fazer Novo Deploy

1. **Forçar novo deploy:**
   - No Railway, vá em **"Deployments"**
   - Clique em **"Redeploy"** ou **"Deploy Latest"**
   - Ou faça um commit vazio para forçar deploy:
     ```bash
     git commit --allow-empty -m "trigger deploy"
     git push
     ```

## 🔍 Verificar se Funcionou

Após o deploy, verifique os logs:

1. **Build deve mostrar:**
   ```
   ✅ npx prisma generate
   ✅ npm run build
   ✅ Arquivos gerados em dist/
   ```

2. **Start deve mostrar:**
   ```
   ✅ Server is running on http://0.0.0.0:8080
   ✅ Prisma Client conectado ao banco de dados
   ```

3. **Não deve mostrar:**
   ```
   ❌ Error: Cannot find module '/app/dist/app.js'
   ```

## 🚨 Se Ainda Não Funcionar

### Alternativa 1: Usar startCommand com caminho completo

No `backend/railway.toml`, altere:
```toml
[deploy]
startCommand = "cd backend && npm start"
```

### Alternativa 2: Verificar se o build está sendo executado

Adicione logs no `backend/nixpacks.toml`:
```toml
[phases.build]
cmds = [
  "npx prisma generate",
  "npm run build",
  "ls -la dist/",
  "cat dist/app.js | head -20",
  "npx prisma db push --accept-data-loss || true"
]
```

### Alternativa 3: Usar start:prod

No `backend/package.json`, altere o script `start`:
```json
"start": "npm run build && node dist/app.js"
```

## 📝 Nota Importante

**O Root Directory é essencial!** Se o Railway não souber que o backend está em `backend/`, ele tentará executar os comandos na raiz do projeto, onde não há `package.json` do backend.

## ✅ Checklist

- [ ] Root Directory configurado como `backend` no Railway
- [ ] Build executado com sucesso
- [ ] Arquivo `dist/app.js` gerado
- [ ] Servidor iniciado corretamente
- [ ] Health check funcionando
