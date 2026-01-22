# Como Executar a Migration da Coluna Foto

A coluna `foto` precisa ser adicionada ao banco de dados. A migration já foi criada, mas precisa ser executada.

## Opção 1: Executar via Railway CLI (Recomendado)

1. Instale o Railway CLI:
```bash
npm i -g @railway/cli
```

2. Faça login:
```bash
railway login
```

3. Conecte ao projeto:
```bash
railway link
```

4. Execute a migration:
```bash
railway run npx prisma migrate deploy
```

## Opção 2: Executar via SQL direto no banco

Execute este SQL no banco de dados PostgreSQL:

```sql
ALTER TABLE "Barbearia" ADD COLUMN IF NOT EXISTS "foto" TEXT;
```

## Opção 3: Usar Prisma Studio (se tiver acesso local)

```bash
cd backend
npx prisma studio
```

E depois executar a migration manualmente.

## Verificar se a coluna foi criada

Execute este SQL para verificar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Barbearia' AND column_name = 'foto';
```

Se retornar uma linha, a coluna existe!

