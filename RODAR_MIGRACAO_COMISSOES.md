# Como Rodar a Migração de Comissões

## Opção 1: Via Railway (Recomendado)

A migração será executada automaticamente quando o código for deployado no Railway, pois o `postinstall` script roda `prisma generate`.

**Se precisar rodar manualmente no Railway:**

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá para o serviço do backend
4. Clique em **"Deployments"**
5. Clique no deployment mais recente
6. Vá para a aba **"Logs"**
7. Procure por: `Running prisma generate` ou `Prisma Client generated`

## Opção 2: Localmente (se tiver Node.js instalado)

### Windows (PowerShell ou CMD):

```bash
cd backend
npm run prisma:push
```

Ou se preferir criar uma migração:

```bash
cd backend
npm run prisma:migrate -- --name add_comissoes
```

### Linux/Mac:

```bash
cd backend
npm run prisma:push
```

## Opção 3: Via Prisma Studio (Visual)

```bash
cd backend
npm run prisma:studio
```

Isso abrirá uma interface visual onde você pode ver e gerenciar os dados.

## Verificar se a Migração Funcionou

Após rodar a migração, verifique se a tabela `ComissaoPaga` foi criada:

1. Acesse seu banco de dados (Supabase, Railway, etc.)
2. Verifique se existe a tabela `ComissaoPaga`
3. Verifique se os relacionamentos foram criados corretamente

## Estrutura da Tabela ComissaoPaga

A tabela deve ter os seguintes campos:
- `id` (String, UUID)
- `profissionalId` (String)
- `agendamentoId` (String)
- `barbeariaId` (String)
- `valorComissao` (Float)
- `valorTotal` (Float)
- `porcentagem` (Float)
- `pago` (Boolean)
- `dataPagamento` (DateTime, opcional)
- `mesReferencia` (String)
- `observacao` (String, opcional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## Troubleshooting

### Erro: "Table already exists"

**Solução:** A tabela já existe. Isso é normal se você já rodou a migração antes.

### Erro: "Migration failed"

**Solução:**
1. Verifique se o `DATABASE_URL` está configurado corretamente
2. Verifique se você tem permissões para criar tabelas
3. Tente usar `prisma db push` em vez de `migrate dev`

### Erro: "Cannot find module 'prisma'"

**Solução:**
```bash
cd backend
npm install
```

## Próximos Passos

Após rodar a migração:

1. ✅ Verifique se a tabela foi criada
2. ✅ Teste acessando `/dono/comissoes` no painel
3. ✅ Crie alguns agendamentos e verifique se as comissões são calculadas
4. ✅ Teste marcar comissões como pagas

## Nota Importante

**No Railway:** A migração será executada automaticamente no próximo deploy. Você não precisa fazer nada manualmente se estiver usando Railway para produção.
