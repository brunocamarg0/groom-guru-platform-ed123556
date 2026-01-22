import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { hashSenha } from '../../utils/password';

const router = Router();

/**
 * Endpoint temporário para corrigir/criar usuários admin
 * GET ou POST /api/admin/corrigir-admin
 * 
 * Parâmetros opcionais (query ou body):
 * - senha: Senha a ser usada (padrão: "Admin123!@#")
 */
router.get('/corrigir-admin', async (req: Request, res: Response) => {
  await corrigirUsuariosAdmin(req, res);
});

router.post('/corrigir-admin', async (req: Request, res: Response) => {
  await corrigirUsuariosAdmin(req, res);
});

interface AdminUser {
  email: string;
  nome: string;
}

const ADMIN_USERS: AdminUser[] = [
  {
    email: 'brunocamargocontato@hotmail.com',
    nome: 'Bruno Camargo',
  },
  {
    email: 'bernardostrabelli@gmail.com',
    nome: 'Bernardo Trabelli',
  },
];

async function corrigirUsuariosAdmin(req: Request, res: Response) {
  try {
    // Pegar senha do query ou body
    const senha = (req.query.senha as string) || (req.body.senha as string) || 'Admin123!@#';
    
    console.log('🔐 Iniciando correção de usuários admin via API...');
    
    // Hash da senha
    const senhaHash = await hashSenha(senha);
    
    const resultados = [];
    
    // Processar cada usuário admin
    for (const adminUser of ADMIN_USERS) {
      // Verificar se já existe
      const adminExistente = await prisma.usuarioAdmin.findUnique({
        where: { email: adminUser.email },
      });
      
      if (adminExistente) {
        // Atualizar usuário existente
        const adminAtualizado = await prisma.usuarioAdmin.update({
          where: { email: adminUser.email },
          data: {
            nome: adminUser.nome,
            senha: senhaHash,
            ativo: true,
            role: 'admin',
          },
        });
        
        resultados.push({
          email: adminAtualizado.email,
          nome: adminAtualizado.nome,
          acao: 'atualizado',
          id: adminAtualizado.id,
        });
      } else {
        // Criar novo usuário admin
        const novoAdmin = await prisma.usuarioAdmin.create({
          data: {
            nome: adminUser.nome,
            email: adminUser.email,
            senha: senhaHash,
            role: 'admin',
            ativo: true,
          },
        });
        
        resultados.push({
          email: novoAdmin.email,
          nome: novoAdmin.nome,
          acao: 'criado',
          id: novoAdmin.id,
        });
      }
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Usuários admin corrigidos/criados com sucesso!',
      usuarios: resultados,
      credenciais: {
        senha: senha,
        nota: 'Guarde esta senha em local seguro. Você pode alterá-la após fazer login.',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao corrigir usuários admin:', error);
    res.status(500).json({ 
      error: 'Erro ao corrigir usuários admin',
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export default router;
