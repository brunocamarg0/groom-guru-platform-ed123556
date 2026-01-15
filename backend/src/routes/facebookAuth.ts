import { Router, Request, Response } from 'express';
import passport from 'passport';
import * as facebookAuthController from '../controllers/facebookAuthController';

const router = Router();

// Rotas de autenticação Facebook para Cliente
router.get(
  '/cliente',
  (req: Request, res: Response, next) => {
    // Salvar tipo na sessão
    (req.session as any).authType = 'cliente';
    next();
  },
  passport.authenticate('facebook-cliente', {
    scope: ['email'],
  })
);

router.get(
  '/cliente/callback',
  passport.authenticate('facebook-cliente', { failureRedirect: '/login?error=facebook_auth_failed' }),
  facebookAuthController.facebookCallbackCliente
);

// Rotas de autenticação Facebook para Dono
router.get(
  '/dono',
  (req: Request, res: Response, next) => {
    // Salvar tipo e barbeariaId na sessão
    (req.session as any).authType = 'dono';
    (req.session as any).barbeariaId = req.query.barbeariaId;
    next();
  },
  passport.authenticate('facebook-dono', {
    scope: ['email'],
  })
);

router.get(
  '/dono/callback',
  passport.authenticate('facebook-dono', { failureRedirect: '/login?error=facebook_auth_failed' }),
  facebookAuthController.facebookCallbackDono
);

export default router;

