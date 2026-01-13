import { Router } from 'express';
import * as financeiroController from '../../controllers/financeiroDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/pagamentos', financeiroController.listarPagamentos);
router.get('/estatisticas', financeiroController.obterEstatisticasFinanceiras);

export default router;

