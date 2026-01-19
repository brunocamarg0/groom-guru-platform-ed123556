import { Router } from 'express';
import * as barbeariasPublicasController from '../controllers/barbeariasPublicasController';

const router = Router();

// Log para debug
console.log('🔧 [BARBEARIAS] Rotas públicas de barbearias registradas');

// Rotas públicas de barbearias (para clientes)
router.get('/', (req, res, next) => {
  console.log('🔧 [BARBEARIAS] GET / chamado');
  next();
}, barbeariasPublicasController.listarBarbeariasPublicas);

router.get('/:id', (req, res, next) => {
  console.log('🔧 [BARBEARIAS] GET /:id chamado, id:', req.params.id);
  next();
}, barbeariasPublicasController.buscarBarbeariaPublica);

// Rota para buscar horários ocupados de uma barbearia em uma data
router.get('/:id/horarios-ocupados', (req, res, next) => {
  console.log('🔧 [BARBEARIAS] GET /:id/horarios-ocupados chamado, id:', req.params.id, 'data:', req.query.data);
  next();
}, barbeariasPublicasController.buscarHorariosOcupados);

export default router;


