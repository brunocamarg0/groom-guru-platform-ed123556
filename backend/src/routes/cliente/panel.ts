import { Router } from 'express';
import * as clientePanelController from '../../controllers/clientePanelController';
import { autenticarCliente } from '../../middleware/authCliente';

const router = Router();

// Todas as rotas requerem autenticação de cliente
router.use(autenticarCliente);

// Perfil
router.get('/perfil', clientePanelController.obterPerfil);
router.put('/perfil', clientePanelController.atualizarPerfil);

// Alterar senha
router.put('/alterar-senha', clientePanelController.alterarSenha);

// Excluir conta (LGPD)
router.delete('/conta', clientePanelController.excluirConta);

// Agendamentos
router.get('/agendamentos', clientePanelController.listarMeusAgendamentos);
router.get('/agendamentos/:id', clientePanelController.buscarMeuAgendamento);
router.post('/agendamentos', clientePanelController.criarMeuAgendamento);
router.put('/agendamentos/:id/cancelar', clientePanelController.cancelarMeuAgendamento);

// Pagamentos
router.post('/pagamentos', clientePanelController.criarPagamento);

// Assinatura
router.get('/assinatura', clientePanelController.obterMinhaAssinatura);
router.get('/assinatura/pagamentos', clientePanelController.listarPagamentosAssinatura);

export default router;

