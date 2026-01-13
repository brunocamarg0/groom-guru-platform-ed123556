import { Router } from 'express';
import * as promocoesController from '../../controllers/promocoesDonoController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', promocoesController.listarPromocoes);
router.post('/', promocoesController.criarPromocao);
router.put('/:id', promocoesController.atualizarPromocao);
router.delete('/:id', promocoesController.removerPromocao);
router.put('/:id/toggle', promocoesController.toggleAtivoPromocao);

export default router;

