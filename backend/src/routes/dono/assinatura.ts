import { Router } from 'express';
import { autenticarDono } from '../../middleware/auth';
import * as faturasController from '../../controllers/faturasController';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

// Rotas de assinatura e faturas do dono
router.get('/faturas', faturasController.listarMinhasFaturas);
router.get('/faturas/:id', faturasController.buscarFatura);
router.post('/faturas/:id/pagar', faturasController.criarLinkPagamento);
router.get('/faturas/:id/status', faturasController.verificarStatusPagamento);

export default router;

