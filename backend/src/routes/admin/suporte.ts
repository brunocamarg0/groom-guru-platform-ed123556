import { Router } from 'express';
import * as ticketSuporteController from '../../controllers/ticketSuporteController';

const router = Router();

// Listar todos os tickets
router.get('/', ticketSuporteController.listarTickets);

// Estatísticas
router.get('/estatisticas', ticketSuporteController.estatisticasTickets);

// Buscar ticket por ID
router.get('/:id', ticketSuporteController.buscarTicket);

// Atualizar status/prioridade
router.put('/:id/status', ticketSuporteController.atualizarStatus);

// Responder ticket
router.post('/:id/responder', ticketSuporteController.responderTicket);

export default router;
