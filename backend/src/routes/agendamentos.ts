import { Router } from 'express';
import * as agendamentosController from '../controllers/agendamentosController';

const router = Router();

// Criar novo agendamento
router.post('/', agendamentosController.criarAgendamento);

// Listar agendamentos de uma barbearia
router.get('/barbearia/:barbeariaId', agendamentosController.listarAgendamentos);

// Listar agendamentos pendentes
router.get('/barbearia/:barbeariaId/pendentes', agendamentosController.listarAgendamentosPendentes);

// Buscar agendamento por ID
router.get('/:id', agendamentosController.buscarAgendamento);

// Confirmar agendamento
router.put('/:id/confirmar', agendamentosController.confirmarAgendamento);

// Recusar agendamento
router.put('/:id/recusar', agendamentosController.recusarAgendamento);

// Cancelar agendamento
router.put('/:id/cancelar', agendamentosController.cancelarAgendamento);

// Concluir agendamento
router.put('/:id/concluir', agendamentosController.concluirAgendamento);

// Atualizar configuração de confirmação da barbearia
router.put('/barbearia/:barbeariaId/configuracao', agendamentosController.atualizarConfiguracaoConfirmacao);

// Verificar disponibilidade de horários
router.get('/disponibilidade', agendamentosController.verificarDisponibilidade);

export default router;
