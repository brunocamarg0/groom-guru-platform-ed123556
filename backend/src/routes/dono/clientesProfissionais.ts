import { Router } from 'express';
import { autenticarDono } from '../../middleware/auth';
import * as clienteProfissionalController from '../../controllers/clienteProfissionalController';

const router = Router();

// Todas as rotas requerem autenticação de dono
router.use(autenticarDono);

// Rotas de atribuição cliente-profissional
router.get('/clientes-profissionais', clienteProfissionalController.listarClientesProfissionais);
router.post('/clientes-profissionais', clienteProfissionalController.criarClienteProfissional);
router.delete('/clientes-profissionais/:id', clienteProfissionalController.removerClienteProfissional);
router.get('/profissionais/:id/clientes', clienteProfissionalController.listarClientesDoProfissional);

export default router;

