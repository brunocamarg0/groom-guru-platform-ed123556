import { Router } from 'express';
import * as relatoriosController from '../../controllers/relatoriosDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', relatoriosController.gerarRelatorio);

export default router;

