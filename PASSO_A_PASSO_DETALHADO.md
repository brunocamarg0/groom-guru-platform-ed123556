# 🚀 Passo a Passo Detalhado: Configurar Supabase e Backend

## ✅ Você já criou o projeto no Supabase! Agora vamos configurar tudo.

---

## 📋 PASSO 1: Obter DATABASE_URL do Supabase (5 minutos)

### 1.1. Acessar o Dashboard do Supabase

1. Acesse: **https://supabase.com**
2. Faça login na sua conta
3. Você verá uma lista de projetos
4. Clique no projeto que você criou (ex: `groom-guru-production`)

### 1.2. Navegar até as Configurações do Banco

1. No menu lateral esquerdo, procure por **"Settings"** (⚙️) ou **"Configurações"**
2. Clique em **"Settings"**
3. No submenu, clique em **"Database"** (ou "Banco de Dados")

### 1.3. Encontrar a Connection String

1. Role a página para baixo até encontrar a seção **"Connection string"** ou **"String de conexão"**
2. Você verá várias abas: **"URI"**, **"JDBC"**, **"Golang"**, etc.
3. Clique na aba **"URI"** (é a primeira opção)

### 1.4. Copiar a Connection String

Você verá algo assim:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

**IMPORTANTE:**
- Esta string tem `[YOUR-PASSWORD]` que precisa ser substituído
- Você precisa substituir `[YOUR-PASSWORD]` pela **senha que você criou** quando criou o projeto no Supabase
- A senha é a que você digitou no campo "Database Password" ao criar o projeto

**Exemplo:**
Se sua senha é `MinhaSenha123!`, a string final seria:
```
postgresql://postgres.abcdefghijklmnop:MinhaSenha123!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 1.5. Copiar a String Completa

1. Clique no botão de **copiar** (ícone de clipboard) ao lado da string
2. Ou selecione toda a string e copie (Ctrl+C)
3. **Anote esta string** - você vai precisar dela no próximo passo

---

## 📋 PASSO 2: Configurar o Arquivo backend/.env (5 minutos)

### 2.1. Abrir o Arquivo .env

1. No VS Code (ou seu editor), vá até a pasta `backend`
2. Procure pelo arquivo `.env`
3. Se não encontrar, crie um novo arquivo chamado `.env` (sem extensão)

**Como criar no VS Code:**
- Clique com botão direito na pasta `backend`
- Selecione "New File"
- Digite `.env` (com o ponto no início)
- Pressione Enter

### 2.2. Preencher o Arquivo .env

Cole o seguinte conteúdo no arquivo `.env`:

```env
# Banco de Dados Supabase
DATABASE_URL="COLE_AQUI_A_STRING_DO_SUPABASE"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret
JWT_SECRET=COLE_AQUI_O_TOKEN_GERADO

# Session Secret
SESSION_SECRET=COLE_AQUI_OUTRO_TOKEN_GERADO
```

### 2.3. Substituir DATABASE_URL

1. No lugar de `COLE_AQUI_A_STRING_DO_SUPABASE`, cole a string que você copiou do Supabase
2. **Lembre-se:** Substitua `[YOUR-PASSWORD]` pela sua senha real

**Exemplo:**
```env
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:MinhaSenha123!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
```

### 2.4. Gerar JWT_SECRET e SESSION_SECRET

Você precisa gerar dois tokens aleatórios e seguros.

#### Opção A: Usar PowerShell (Windows)

1. Abra o PowerShell (não o CMD)
2. Execute este comando para gerar o primeiro token:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

3. Copie o resultado e cole no lugar de `COLE_AQUI_O_TOKEN_GERADO` no campo `JWT_SECRET`
4. Execute o comando novamente para gerar outro token
5. Cole este segundo token no campo `SESSION_SECRET`

#### Opção B: Usar Gerador Online (Mais Fácil)

1. Acesse: **https://generate-secret.vercel.app/32**
2. Clique em "Generate"
3. Copie o token gerado
4. Cole no campo `JWT_SECRET` do arquivo `.env`
5. Clique em "Generate" novamente para gerar outro token
6. Cole este segundo token no campo `SESSION_SECRET`

#### Opção C: Usar Node.js

Se você tem Node.js instalado:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Execute duas vezes para gerar dois tokens diferentes.

### 2.5. Exemplo Final do Arquivo .env

Seu arquivo `.env` deve ficar assim (com seus valores reais):

```env
# Banco de Dados Supabase
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:MinhaSenha123!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT Secret
JWT_SECRET=K8jL3mN9pQ2rS5tU7vW0xY1zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8z

# Session Secret
SESSION_SECRET=A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0
```

**⚠️ IMPORTANTE:**
- Não use os tokens de exemplo acima! Gere seus próprios tokens
- Não compartilhe este arquivo com ninguém
- Não commite este arquivo no Git (ele já está no .gitignore)

---

## 📋 PASSO 3: Instalar Dependências do Backend (2 minutos)

### 3.1. Abrir o Terminal

1. No VS Code, abra o terminal (Terminal → New Terminal)
2. Ou abra o PowerShell/CMD na pasta do projeto

### 3.2. Navegar até a Pasta Backend

```bash
cd backend
```

### 3.3. Instalar Dependências

```bash
npm install
```

Isso vai instalar todas as dependências necessárias. Pode levar 1-2 minutos.

**Se der erro:**
- Verifique se você tem Node.js instalado: `node --version`
- Se não tiver, instale: https://nodejs.org/

---

## 📋 PASSO 4: Gerar o Prisma Client (1 minuto)

Após instalar as dependências, execute:

```bash
npx prisma generate
```

Este comando gera o cliente Prisma baseado no schema do banco de dados.

**O que acontece:**
- O Prisma lê o arquivo `backend/prisma/schema.prisma`
- Gera código TypeScript para acessar o banco de dados
- Cria a pasta `node_modules/.prisma/client`

---

## 📋 PASSO 5: Executar Migrações (2 minutos)

### 5.1. Executar a Migração

```bash
npx prisma migrate dev --name add_profissionais_produtos_promocoes
```

**O que acontece:**
- O Prisma conecta ao banco Supabase
- Cria todas as tabelas necessárias no banco
- Aplica todas as migrações pendentes

### 5.2. Verificar se Funcionou

Se tudo der certo, você verá algo como:

```
✔ Migration applied successfully
```

**Se der erro de conexão:**
- Verifique se o `DATABASE_URL` no `.env` está correto
- Verifique se a senha está correta
- Verifique se o projeto Supabase está ativo

**Se der erro de autenticação:**
- Verifique se substituiu `[YOUR-PASSWORD]` pela senha real
- Tente copiar a connection string novamente do Supabase

---

## 📋 PASSO 6: Testar o Backend (1 minuto)

### 6.1. Iniciar o Servidor

```bash
npm run dev
```

### 6.2. Verificar se Está Funcionando

Se tudo estiver correto, você verá:

```
🚀 Server is running on http://localhost:3001
📚 API Health: http://localhost:3001/api/health
✅ Jobs agendados configurados:
   - Lembretes de agendamento: A cada hora (minuto 0)
```

### 6.3. Testar a API

Abra seu navegador e acesse:

```
http://localhost:3001/api/health
```

Você deve ver uma resposta JSON:

```json
{
  "status": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**✅ Se aparecer isso, está funcionando perfeitamente!**

---

## 📋 PASSO 7: Configurar o Frontend (1 minuto)

### 7.1. Criar Arquivo .env na Raiz do Projeto

1. Na raiz do projeto (não na pasta backend), crie um arquivo `.env`
2. Adicione o seguinte conteúdo:

```env
VITE_API_URL=http://localhost:3001/api
```

### 7.2. Salvar o Arquivo

Salve o arquivo `.env` na raiz do projeto.

---

## 📋 PASSO 8: Testar Tudo Junto (2 minutos)

### 8.1. Terminal 1 - Backend

No primeiro terminal, execute:

```bash
cd backend
npm run dev
```

Deixe este terminal aberto e rodando.

### 8.2. Terminal 2 - Frontend

Abra um **novo terminal** e execute:

```bash
npm run dev
```

### 8.3. Acessar o Sistema

1. Abra seu navegador
2. Acesse: **http://localhost:5173**
3. Faça login no sistema
4. Acesse o painel do dono

**✅ Se tudo funcionar, você está pronto!**

---

## 🆘 Problemas Comuns e Soluções

### Erro: "Can't reach database server"

**Solução:**
1. Verifique se o `DATABASE_URL` está correto
2. Verifique se a senha está correta (sem espaços extras)
3. Verifique se o projeto Supabase está ativo
4. Tente usar a connection string direta (sem pgbouncer):
   ```
   postgresql://postgres:[SENHA]@db.xxxxx.supabase.co:5432/postgres
   ```

### Erro: "Migration failed"

**Solução:**
1. Verifique se o banco está acessível
2. Tente executar novamente: `npx prisma migrate dev`
3. Se persistir, tente resetar (CUIDADO: apaga dados):
   ```bash
   npx prisma migrate reset
   ```

### Erro: "Module not found: @prisma/client"

**Solução:**
```bash
cd backend
npm install
npx prisma generate
```

### Erro: "Token inválido" no frontend

**Solução:**
1. Verifique se o arquivo `.env` na raiz tem `VITE_API_URL=http://localhost:3001/api`
2. Reinicie o servidor do frontend
3. Verifique se o backend está rodando na porta 3001

---

## ✅ Checklist Final

Marque cada item conforme completa:

- [ ] Projeto criado no Supabase
- [ ] DATABASE_URL copiado do Supabase
- [ ] Arquivo `backend/.env` criado e preenchido
- [ ] JWT_SECRET gerado e configurado
- [ ] SESSION_SECRET gerado e configurado
- [ ] `npm install` executado no backend
- [ ] `npx prisma generate` executado
- [ ] `npx prisma migrate dev` executado com sucesso
- [ ] Backend rodando (`npm run dev`)
- [ ] API Health respondendo (http://localhost:3001/api/health)
- [ ] Arquivo `.env` criado na raiz do projeto
- [ ] Frontend rodando (`npm run dev`)
- [ ] Sistema acessível em http://localhost:5173

---

## 🎉 Pronto!

Se todos os itens acima estão marcados, seu sistema está **100% funcional** e conectado ao banco de dados Supabase!

Se tiver alguma dúvida em qualquer passo, me avise que eu ajudo! 😊
