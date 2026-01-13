import { Router } from 'express';
import * as notificacoesController from '../../controllers/notificacoesDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', notificacoesController.listarNotificacoes);
router.put('/:id/lida', notificacoesController.marcarNotificacaoLida);
router.put('/marcar-todas-lidas', notificacoesController.marcarTodasComoLidas);

export default router;

