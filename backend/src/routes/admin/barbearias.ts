import { Router } from 'express';
import * as barbeariasController from '../../controllers/barbeariasController';

const router = Router();

// Rotas de barbearias
router.get('/', barbeariasController.listarBarbearias);
router.get('/:id', barbeariasController.buscarBarbearia);
router.post('/', barbeariasController.criarBarbearia);
router.put('/:id', barbeariasController.atualizarBarbearia);
router.patch('/:id/status', barbeariasController.alterarStatusBarbearia);
router.delete('/:id', barbeariasController.deletarBarbearia);

export default router;

