import { Router } from 'express';
import * as ticketSuporteController from '../../controllers/ticketSuporteController';

const router = Router();

// Rota pública para criar ticket (cliente pode não estar logado)
router.post('/', ticketSuporteController.criarTicket);

export default router;
