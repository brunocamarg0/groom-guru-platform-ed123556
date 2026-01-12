import { Router } from 'express';
import * as clientesController from '../../controllers/clientesController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

router.get('/', clientesController.listarClientes);
router.get('/:id', clientesController.buscarCliente);
router.post('/', clientesController.criarCliente);
router.put('/:id', clientesController.atualizarCliente);

export default router;
