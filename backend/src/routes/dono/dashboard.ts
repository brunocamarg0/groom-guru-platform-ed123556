import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboardController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/kpis', dashboardController.obterKPIs);

export default router;
