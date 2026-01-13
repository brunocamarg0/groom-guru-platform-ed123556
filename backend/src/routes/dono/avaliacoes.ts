import { Router } from 'express';
import * as avaliacoesController from '../../controllers/avaliacoesDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', avaliacoesController.listarAvaliacoes);
router.get('/estatisticas', avaliacoesController.obterEstatisticasAvaliacoes);
router.put('/:id/responder', avaliacoesController.responderAvaliacao);

export default router;

