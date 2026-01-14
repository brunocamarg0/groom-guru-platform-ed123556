# 🚀 Comandos para Executar Agora

## ✅ Você já configurou o arquivo backend/.env com os tokens!

Agora você precisa executar estes comandos **no terminal** (PowerShell ou CMD).

---

## 📋 PASSO 3: Instalar Dependências

1. Abra o **PowerShell** ou **CMD**
2. Navegue até a pasta do projeto:
   ```powershell
   cd C:\Users\terceiro_rcc02\Documents\groom-guru-platform\backend
   ```

3. Execute:
   ```bash
   npm install
   ```

   ⏱️ Isso pode levar 1-2 minutos. Aguarde terminar.

---

## 📋 PASSO 4: Gerar Prisma Client

Após o `npm install` terminar, execute:

```bash
npx prisma generate
```

⏱️ Isso leva alguns segundos.

---

## 📋 PASSO 5: Executar Migrações (Criar Tabelas no Banco)

Execute:

```bash
npx prisma migrate dev --name add_profissionais_produtos_promocoes
```

**O que acontece:**
- Conecta ao banco Supabase
- Cria todas as tabelas necessárias
- Aplica as migrações

**Se der certo, você verá:**
```
✔ Migration applied successfully
```

**Se der erro de conexão:**
- Verifique se o `DATABASE_URL` no `.env` está correto
- Verifique se a senha está correta
- Verifique se o projeto Supabase está ativo

---

## 📋 PASSO 6: Testar o Backend

Execute:

```bash
npm run dev
```

**Se der certo, você verá:**
```
🚀 Server is running on http://localhost:3001
📚 API Health: http://localhost:3001/api/health
```

**✅ Se aparecer isso, está funcionando perfeitamente!**

---

## 🆘 Se Node.js não estiver instalado

Se aparecer erro "node não é reconhecido", você precisa instalar o Node.js:

1. Acesse: **https://nodejs.org/**
2. Baixe a versão **LTS** (Long Term Support)
3. Instale (siga o assistente de instalação)
4. **Reinicie o terminal** após instalar
5. Execute os comandos novamente

---

## 📝 Resumo dos Comandos (Copie e Cole)

Execute estes comandos **um por vez**, na ordem:

```bash
cd C:\Users\terceiro_rcc02\Documents\groom-guru-platform\backend

npm install

npx prisma generate

npx prisma migrate dev --name add_profissionais_produtos_promocoes

npm run dev
```

---

## ✅ Depois que o servidor iniciar

1. Deixe o terminal aberto (o servidor precisa ficar rodando)
2. Abra outro terminal para o frontend
3. Ou me avise que está funcionando e eu te ajudo com o próximo passo!

---

**Me avise se tiver algum erro ou dúvida!** 😊
