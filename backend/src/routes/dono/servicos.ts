import { Router } from 'express';
import * as servicosController from '../../controllers/servicosDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', servicosController.listarServicos);
router.post('/', servicosController.criarServico);
router.put('/:id', servicosController.atualizarServico);
router.delete('/:id', servicosController.removerServico);
router.put('/:id/toggle', servicosController.toggleAtivoServico);

export default router;
