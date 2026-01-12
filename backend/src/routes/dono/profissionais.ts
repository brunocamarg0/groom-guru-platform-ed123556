import { Router } from 'express';
import * as profissionaisController from '../../controllers/profissionaisController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', profissionaisController.listarProfissionais);
router.get('/:id', profissionaisController.buscarProfissional);
router.post('/', profissionaisController.criarProfissional);
router.put('/:id', profissionaisController.atualizarProfissional);
router.delete('/:id', profissionaisController.removerProfissional);
router.put('/:id/toggle', profissionaisController.toggleAtivoProfissional);

export default router;
