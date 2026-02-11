-- Criar tabela de Planos
CREATE TABLE IF NOT EXISTS "Plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valorMensal" DOUBLE PRECISION NOT NULL,
    "limiteBarbeiros" INTEGER NOT NULL DEFAULT 1,
    "limiteAgendamentos" INTEGER NOT NULL DEFAULT 100,
    "recursos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- Criar tabela de Assinaturas
CREATE TABLE IF NOT EXISTS "Assinatura" (
    "id" TEXT NOT NULL,
    "barbeariaId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "proximoVencimento" TIMESTAMP(3) NOT NULL,
    "pagamentoRecorrente" BOOLEAN NOT NULL DEFAULT false,
    "mercadoPagoSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- Criar tabela de Faturas
CREATE TABLE IF NOT EXISTS "Fatura" (
    "id" TEXT NOT NULL,
    "assinaturaId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "metodoPagamento" TEXT,
    "mercadoPagoPreferenceId" TEXT,
    "mercadoPagoPaymentId" TEXT,
    "mercadoPagoStatus" TEXT,
    "linkPagamento" TEXT,
    "qrCodePix" TEXT,
    "codigoBoleto" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fatura_pkey" PRIMARY KEY ("id")
);

-- Adicionar foreign keys
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_barbeariaId_fkey" 
    FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_planoId_fkey" 
    FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Fatura" ADD CONSTRAINT "Fatura_assinaturaId_fkey" 
    FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "Assinatura_barbeariaId_key" ON "Assinatura"("barbeariaId");

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS "Assinatura_status_idx" ON "Assinatura"("status");
CREATE INDEX IF NOT EXISTS "Assinatura_dataVencimento_idx" ON "Assinatura"("dataVencimento");
CREATE INDEX IF NOT EXISTS "Fatura_assinaturaId_status_idx" ON "Fatura"("assinaturaId", "status");
CREATE INDEX IF NOT EXISTS "Fatura_dataVencimento_idx" ON "Fatura"("dataVencimento");
CREATE INDEX IF NOT EXISTS "Fatura_status_idx" ON "Fatura"("status");

