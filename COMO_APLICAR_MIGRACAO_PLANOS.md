# Como Verificar e Aplicar a Migração de Planos e Assinaturas

## 🔍 Verificar se o Banco está Disponível

### Opção 1: Usar o Script de Verificação
```bash
cd backend
npx tsx scripts/verificar-banco.ts
```

Este script vai:
- ✅ Verificar se consegue conectar ao banco
- 📋 Listar todas as tabelas existentes
- 🔍 Verificar se as novas tabelas já existem

### Opção 2: Verificar Manualmente com Prisma
```bash
cd backend

# Verificar status das migrações
npx prisma migrate status

# Tentar conectar ao banco
npx prisma db pull
```

### Opção 3: Verificar no Railway/Vercel
1. Acesse o painel do Railway/Vercel
2. Vá em **Deployments** ou **Logs**
3. Verifique se há erros de conexão com o banco
4. Se o deploy está funcionando, o banco está disponível

## 📦 Aplicar a Migração

### Se o banco está disponível localmente:
```bash
cd backend

# Criar a migração
npx prisma migrate dev --name add_planos_assinaturas_clientes

# Isso vai:
# 1. Criar o arquivo de migração
# 2. Aplicar no banco local
# 3. Gerar o Prisma Client atualizado
```

### Se o banco está no Railway/Produção:
A migração será aplicada automaticamente quando você fizer deploy, pois o script `start` no `package.json` já executa `npx prisma migrate deploy`.

**OU** você pode aplicar manualmente:
```bash
cd backend
npx prisma migrate deploy
```

## ✅ Verificar se a Migração Foi Aplicada

### Verificar tabelas criadas:
```bash
cd backend
npx prisma studio
```

No Prisma Studio, você deve ver as novas tabelas:
- ✅ `PlanoCliente`
- ✅ `AssinaturaCliente`
- ✅ `PagamentoAssinatura`
- ✅ `ComissaoAssinatura`
- ✅ `ClienteProfissional`

### Verificar via código:
```bash
cd backend
npx tsx scripts/verificar-banco.ts
```

## 🚨 Problemas Comuns

### Erro: "Can't reach database server"
- Verifique se a `DATABASE_URL` está configurada corretamente
- Verifique se o banco está rodando (Railway/Vercel)
- Verifique as credenciais

### Erro: "Migration failed"
- Verifique os logs do erro
- Pode ser que algumas tabelas já existam
- Use `npx prisma migrate resolve --applied <migration-name>` se necessário

### Erro: "Schema is not in sync"
- Execute: `npx prisma generate`
- Depois: `npx prisma migrate dev`

## 📝 Próximos Passos Após Aplicar a Migração

1. ✅ Verificar se todas as tabelas foram criadas
2. ✅ Testar os endpoints da API
3. ✅ Criar alguns planos de teste
4. ✅ Criar assinaturas de teste
5. ✅ Verificar se as comissões estão sendo geradas corretamente


