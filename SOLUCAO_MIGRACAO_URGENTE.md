# ⚠️ SOLUÇÃO URGENTE: Tabelas não criadas no banco de dados

## 🎯 Problema
Ao tentar criar um cliente, aparece a mensagem:
> "Tabelas não criadas no banco de dados. Execute as migrações: npm run prisma:push"

## ✅ Solução: Railway (Produção)

Como você está usando Railway, a migração será executada **automaticamente** no próximo deploy. Siga estes passos:

### Passo 1: Fazer commit e push das alterações
```bash
git add .
git commit -m "fix: atualizar schema prisma"
git push
```

### Passo 2: Aguardar deploy no Railway
- O Railway detectará as mudanças
- Executará `npx prisma generate` automaticamente
- As tabelas serão criadas/atualizadas

### Passo 3: Verificar logs do Railway
1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá para o serviço do backend
4. Clique em **"Deployments"**
5. Veja os logs do deployment mais recente
6. Procure por: `Running prisma generate` ou `Prisma Client generated`

## 🔧 Solução Alternativa: Executar Manualmente no Railway

Se quiser executar manualmente ANTES do deploy:

### Opção A: Via Railway Console
1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá para o serviço do backend
4. Clique em **"Deployments"**
5. Clique no deployment mais recente
6. Vá para a aba **"Console"** ou **"Shell"**
7. Execute:
   ```bash
   npx prisma db push
   ```

### Opção B: Via Railway CLI (se tiver instalado)
```bash
railway run npx prisma db push
```

## 📋 O que precisa ser criado:

As seguintes tabelas precisam existir no banco:
- ✅ `Cliente` - Para cadastro de clientes
- ✅ `Agendamento` - Para agendamentos
- ✅ `ComissaoPaga` - Para sistema de comissões
- ✅ `Barbearia` - Para barbearias
- ✅ `Servico` - Para serviços
- ✅ `Profissional` - Para profissionais
- ✅ E outras tabelas relacionadas

## ✅ Verificar se funcionou:

Após o deploy ou execução manual:

1. Tente criar o cliente novamente
2. Se ainda der erro, verifique os logs do Railway
3. Verifique se o `DATABASE_URL` está configurado corretamente

## 🚨 Se ainda não funcionar:

1. **Verifique a variável DATABASE_URL no Railway:**
   - Vá em **Variables** no serviço do backend
   - Confirme que `DATABASE_URL` está configurada
   - Deve ser algo como: `postgresql://user:password@host:port/database`

2. **Verifique os logs do Railway:**
   - Procure por erros relacionados ao Prisma
   - Procure por erros de conexão com o banco

3. **Execute novamente:**
   - Faça um novo deploy
   - Ou execute `npx prisma db push` via console

## 💡 Nota Importante

**A migração será executada automaticamente no Railway quando você fizer deploy!**

Não é necessário executar manualmente se você estiver usando Railway para produção. Basta fazer commit e push das alterações.

## 📝 Próximos Passos Após Migração:

1. ✅ Tabelas criadas
2. ✅ Execute: `npm run criar-cliente-teste` (via Railway Console)
3. ✅ Teste o login como cliente
4. ✅ Teste o agendamento
5. ✅ Verifique no painel do dono
