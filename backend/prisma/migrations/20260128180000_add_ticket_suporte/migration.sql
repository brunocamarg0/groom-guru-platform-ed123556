-- Criar tabela de tickets de suporte
CREATE TABLE IF NOT EXISTS "TicketSuporte" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "prioridade" TEXT NOT NULL DEFAULT 'media',
    "clienteId" TEXT,
    "clienteNome" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "resposta" TEXT,
    "respondidoPor" TEXT,
    "respondidoEm" TIMESTAMP(3),
    "resolvidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketSuporte_pkey" PRIMARY KEY ("id")
);

-- Adicionar foreign key para Cliente (opcional)
ALTER TABLE "TicketSuporte" ADD CONSTRAINT "TicketSuporte_clienteId_fkey" 
    FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS "TicketSuporte_status_idx" ON "TicketSuporte"("status");
CREATE INDEX IF NOT EXISTS "TicketSuporte_clienteId_idx" ON "TicketSuporte"("clienteId");
CREATE INDEX IF NOT EXISTS "TicketSuporte_createdAt_idx" ON "TicketSuporte"("createdAt");
