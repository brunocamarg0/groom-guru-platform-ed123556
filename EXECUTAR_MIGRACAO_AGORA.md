# Executar Migração do Prisma - URGENTE

## ⚠️ Erro: Tabelas não criadas no banco de dados

Você precisa executar a migração do Prisma para criar as tabelas no banco de dados.

## 🚀 Solução Rápida

### Opção 1: Via Railway (Recomendado para Produção)

A migração será executada automaticamente no próximo deploy. Mas se quiser executar manualmente:

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá para o serviço do backend
4. Clique em **"Deployments"**
5. Clique no deployment mais recente
6. Vá para a aba **"Logs"**
7. Procure por: `Running prisma generate` ou `Prisma Client generated`

### Opção 2: Localmente (se tiver Node.js instalado)

**Windows (PowerShell ou CMD):**
```bash
cd backend
npm run prisma:push
```

**Ou se npm não estiver no PATH:**
```bash
cd backend
npx prisma db push
```

**Linux/Mac:**
```bash
cd backend
npm run prisma:push
```

## 📋 O que o comando faz:

1. Lê o arquivo `schema.prisma`
2. Compara com o banco de dados atual
3. Cria/atualiza as tabelas necessárias
4. Gera o Prisma Client

## ✅ Após executar:

1. As tabelas serão criadas no banco de dados
2. Você poderá criar o cliente de teste
3. O sistema funcionará normalmente

## 🔍 Verificar se funcionou:

Após executar, tente criar o cliente novamente. Se ainda der erro, verifique:

1. Se o `DATABASE_URL` está configurado corretamente
2. Se você tem permissões para criar tabelas no banco
3. Os logs do comando para ver se há erros

## 💡 Nota Importante

**No Railway:** A migração será executada automaticamente quando o código for deployado. Você não precisa fazer nada manualmente se estiver usando Railway para produção.
