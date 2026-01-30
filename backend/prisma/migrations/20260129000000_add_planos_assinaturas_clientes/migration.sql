-- CreateTable
CREATE TABLE "PlanoCliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "duracaoMeses" INTEGER NOT NULL,
    "beneficios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "barbeariaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "proximoVencimento" TIMESTAMP(3) NOT NULL,
    "pagamentoRecorrente" BOOLEAN NOT NULL DEFAULT false,
    "mercadoPagoSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssinaturaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagamentoAssinatura" (
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

    CONSTRAINT "PagamentoAssinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComissaoAssinatura" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "assinaturaId" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,
    "valorComissao" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" TIMESTAMP(3),
    "mesReferencia" TEXT NOT NULL,
    "observacao" TEXT,
    "barbeariaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComissaoAssinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteProfissional" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteProfissional_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN "comissaoAssinatura" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PagamentoAssinatura_assinaturaId_status_idx" ON "PagamentoAssinatura"("assinaturaId", "status");

-- CreateIndex
CREATE INDEX "PagamentoAssinatura_dataVencimento_idx" ON "PagamentoAssinatura"("dataVencimento");

-- CreateIndex
CREATE INDEX "ComissaoAssinatura_profissionalId_mesReferencia_idx" ON "ComissaoAssinatura"("profissionalId", "mesReferencia");

-- CreateIndex
CREATE INDEX "ComissaoAssinatura_barbeariaId_mesReferencia_idx" ON "ComissaoAssinatura"("barbeariaId", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "ComissaoAssinatura_pagamentoId_profissionalId_key" ON "ComissaoAssinatura"("pagamentoId", "profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteProfissional_clienteId_profissionalId_key" ON "ClienteProfissional"("clienteId", "profissionalId");

-- CreateIndex
CREATE INDEX "ClienteProfissional_clienteId_idx" ON "ClienteProfissional"("clienteId");

-- CreateIndex
CREATE INDEX "ClienteProfissional_profissionalId_idx" ON "ClienteProfissional"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaCliente_clienteId_key" ON "AssinaturaCliente"("clienteId");

-- AddForeignKey
ALTER TABLE "PlanoCliente" ADD CONSTRAINT "PlanoCliente_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaCliente" ADD CONSTRAINT "AssinaturaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaCliente" ADD CONSTRAINT "AssinaturaCliente_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoCliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaCliente" ADD CONSTRAINT "AssinaturaCliente_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoAssinatura" ADD CONSTRAINT "PagamentoAssinatura_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "AssinaturaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComissaoAssinatura" ADD CONSTRAINT "ComissaoAssinatura_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComissaoAssinatura" ADD CONSTRAINT "ComissaoAssinatura_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "AssinaturaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComissaoAssinatura" ADD CONSTRAINT "ComissaoAssinatura_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "PagamentoAssinatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComissaoAssinatura" ADD CONSTRAINT "ComissaoAssinatura_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteProfissional" ADD CONSTRAINT "ClienteProfissional_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteProfissional" ADD CONSTRAINT "ClienteProfissional_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

