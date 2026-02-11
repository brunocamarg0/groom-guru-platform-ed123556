import { Router } from 'express';
import * as assinaturasController from '../../controllers/assinaturasController';

const router = Router();

// Rotas de assinaturas (admin)
router.get('/', assinaturasController.listarAssinaturas);
router.get('/:id', assinaturasController.buscarAssinatura);
router.post('/', assinaturasController.criarAssinatura);
router.put('/:id', assinaturasController.atualizarAssinatura);
router.delete('/:id', assinaturasController.cancelarAssinatura);
router.post('/:id/gerar-fatura', assinaturasController.gerarFatura);
router.get('/:id/faturas', assinaturasController.listarFaturas);

export default router;

