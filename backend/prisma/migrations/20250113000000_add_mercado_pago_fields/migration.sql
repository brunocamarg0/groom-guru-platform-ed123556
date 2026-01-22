-- AlterTable: Adicionar campo formaPagamento ao Agendamento
ALTER TABLE "Agendamento" ADD COLUMN IF NOT EXISTS "formaPagamento" TEXT;

-- AlterTable: Adicionar campos do Mercado Pago ao Pagamento
ALTER TABLE "Pagamento" ADD COLUMN IF NOT EXISTS "mercadoPagoPreferenceId" TEXT;
ALTER TABLE "Pagamento" ADD COLUMN IF NOT EXISTS "mercadoPagoPaymentId" TEXT;
ALTER TABLE "Pagamento" ADD COLUMN IF NOT EXISTS "mercadoPagoStatus" TEXT;
ALTER TABLE "Pagamento" ADD COLUMN IF NOT EXISTS "mercadoPagoPaymentType" TEXT;

