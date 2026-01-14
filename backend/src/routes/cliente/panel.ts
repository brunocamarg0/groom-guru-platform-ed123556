import { Router } from 'express';
import * as clientePanelController from '../../controllers/clientePanelController';
import { autenticarCliente } from '../../middleware/authCliente';

const router = Router();

// Todas as rotas requerem autenticação de cliente
router.use(autenticarCliente);

// Perfil
router.get('/perfil', clientePanelController.obterPerfil);
router.put('/perfil', clientePanelController.atualizarPerfil);

// Agendamentos
router.get('/agendamentos', clientePanelController.listarMeusAgendamentos);
router.get('/agendamentos/:id', clientePanelController.buscarMeuAgendamento);
router.post('/agendamentos', clientePanelController.criarMeuAgendamento);
router.put('/agendamentos/:id/cancelar', clientePanelController.cancelarMeuAgendamento);

export default router;

