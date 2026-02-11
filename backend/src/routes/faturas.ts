import { Router } from 'express';
import * as faturasController from '../controllers/faturasController';

const router = Router();

// Webhook do Mercado Pago (público, mas validado por assinatura)
router.post('/webhook', faturasController.webhookPagamento);

export default router;

