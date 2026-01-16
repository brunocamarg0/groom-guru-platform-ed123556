import { Router } from 'express';
import * as clientesController from '../../controllers/clientesController';
import { autenticarDono } from '../../middleware/auth';

const router = Router();

// Aplicar autenticação do dono
router.use(autenticarDono);

// Rotas específicas primeiro (sem parâmetros)
router.get('/', clientesController.listarClientes);
router.post('/', clientesController.criarCliente);

// Rotas com parâmetros - IMPORTANTE: DELETE e PUT antes de GET para evitar conflitos
router.delete('/:id', clientesController.deletarCliente);
router.put('/:id', clientesController.atualizarCliente);
router.get('/:id', clientesController.buscarCliente);

// Log para debug
console.log('✅ Rotas de clientes registradas:');
console.log('   GET    /api/dono/clientes');
console.log('   POST   /api/dono/clientes');
console.log('   DELETE /api/dono/clientes/:id');
console.log('   PUT    /api/dono/clientes/:id');
console.log('   GET    /api/dono/clientes/:id');

export default router;
