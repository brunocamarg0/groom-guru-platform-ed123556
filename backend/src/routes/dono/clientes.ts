import { Router } from 'express';
import * as clientesController from '../../controllers/clientesController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Aplicar autenticação do dono
router.use(autenticarDono);

router.get('/', clientesController.listarClientes);
router.get('/:id', clientesController.buscarCliente);
router.post('/', clientesController.criarCliente);
router.put('/:id', clientesController.atualizarCliente);
router.delete('/:id', clientesController.deletarCliente);

export default router;
