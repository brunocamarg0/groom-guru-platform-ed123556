import { Router } from 'express';
import * as pagamentoController from '../controllers/pagamentoController';
import { autenticarCliente } from '../middleware/auth';

const router = Router();

// Criar preferência de pagamento para assinatura (público - "Assinar agora" na landing)
router.post('/preferencia-assinatura', pagamentoController.criarPreferenciaAssinatura);

// Criar preferência de pagamento no Mercado Pago (requer autenticação)
router.post('/preferencia', autenticarCliente, pagamentoController.criarPreferenciaPagamento);

// Webhook do Mercado Pago (público - Mercado Pago chama esta rota)
router.post('/webhook', pagamentoController.webhookPagamento);

// Verificar status do pagamento (requer autenticação)
router.get('/status/:agendamentoId', autenticarCliente, pagamentoController.verificarStatusPagamento);

// Criar pagamento presencial (requer autenticação)
router.post('/presencial', autenticarCliente, pagamentoController.criarPagamentoPresencial);

export default router;

