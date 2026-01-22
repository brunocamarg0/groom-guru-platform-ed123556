import { Router } from 'express';
import { autenticarDono } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middleware/auth';

const router = Router();

// Aplicar autenticação do dono
router.use(autenticarDono);

/**
 * GET /api/dono/configuracao
 * Buscar configuração da barbearia
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { barbeariaId } = req;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Tentar buscar com foto primeiro, se falhar, buscar sem foto
    let barbearia;
    try {
      barbearia = await prisma.barbearia.findUnique({
        where: { id: barbeariaId },
        select: {
          id: true,
          nome: true,
          cnpjCpf: true,
          responsavel: true,
          plano: true,
          status: true,
          email: true,
          telefone: true,
          endereco: true,
          cidade: true,
          bairro: true,
          cep: true,
          modoConfirmacao: true,
          foto: true,
          dataCriacao: true,
          dataVencimento: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      // Se coluna foto não existir, buscar sem foto
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        console.warn('⚠️ [CONFIG BACKEND] Coluna foto não existe, buscando sem foto');
        barbearia = await prisma.barbearia.findUnique({
          where: { id: barbeariaId },
          select: {
            id: true,
            nome: true,
            cnpjCpf: true,
            responsavel: true,
            plano: true,
            status: true,
            email: true,
            telefone: true,
            endereco: true,
            cidade: true,
            bairro: true,
            cep: true,
            modoConfirmacao: true,
            // foto removida
            dataCriacao: true,
            dataVencimento: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        // Adicionar foto como null se não existir
        if (barbearia) {
          (barbearia as any).foto = null;
        }
      } else {
        throw error;
      }
    }

    if (!barbearia) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    res.json(barbearia);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
});

/**
 * PUT /api/dono/configuracao
 * Atualizar configuração da barbearia
 */
router.put('/', async (req: AuthRequest, res) => {
  try {
    console.log('💾 [CONFIG BACKEND] Recebendo requisição PUT /dono/configuracao');
    console.log('💾 [CONFIG BACKEND] barbeariaId:', req.barbeariaId);
    console.log('💾 [CONFIG BACKEND] userId:', req.userId);
    console.log('💾 [CONFIG BACKEND] userType:', req.userType);
    console.log('💾 [CONFIG BACKEND] Campos recebidos:', Object.keys(req.body));
    console.log('💾 [CONFIG BACKEND] Tem foto:', !!req.body.foto);
    console.log('💾 [CONFIG BACKEND] Tamanho foto:', req.body.foto ? req.body.foto.length : 0);
    
    const { barbeariaId } = req;
    const dados = req.body;

    if (!barbeariaId) {
      console.error('❌ [CONFIG BACKEND] Barbearia não identificada');
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    console.log('💾 [CONFIG BACKEND] Atualizando barbearia no banco...');
    
    // Preparar dados de atualização
    const updateData: any = {
      ...(dados.nome && { nome: dados.nome }),
      ...(dados.cnpjCpf !== undefined && { cnpjCpf: dados.cnpjCpf }),
      ...(dados.responsavel !== undefined && { responsavel: dados.responsavel }),
      ...(dados.email !== undefined && { email: dados.email }),
      ...(dados.telefone !== undefined && { telefone: dados.telefone }),
      ...(dados.endereco !== undefined && { endereco: dados.endereco }),
      ...(dados.cidade !== undefined && { cidade: dados.cidade }),
      ...(dados.bairro !== undefined && { bairro: dados.bairro }),
      ...(dados.cep !== undefined && { cep: dados.cep }),
      ...(dados.modoConfirmacao !== undefined && { modoConfirmacao: dados.modoConfirmacao }),
      ...(dados.status !== undefined && { status: dados.status }),
      ...(dados.foto !== undefined && { foto: dados.foto }),
    };
    
    let barbearia;
    try {
      // Tentar atualizar com todos os campos incluindo foto
      barbearia = await prisma.barbearia.update({
        where: { id: barbeariaId },
        data: updateData,
      });
    } catch (updateError: any) {
      // Se o erro for de coluna inexistente (P2022) e tiver foto no update, usar SQL raw
      if (
        (updateError?.code === 'P2022' || updateError?.message?.includes('does not exist')) &&
        dados.foto !== undefined
      ) {
        console.warn('⚠️ [CONFIG BACKEND] Coluna foto não existe ainda, usando SQL raw para atualizar sem foto');
        const updateDataSemFoto = { ...updateData };
        delete updateDataSemFoto.foto;
        
        // Construir query SQL manualmente
        const campos: string[] = [];
        const valores: any[] = [];
        let paramIndex = 1;
        
        if (updateDataSemFoto.nome) {
          campos.push(`nome = $${paramIndex}`);
          valores.push(updateDataSemFoto.nome);
          paramIndex++;
        }
        if (updateDataSemFoto.cnpjCpf !== undefined) {
          campos.push(`"cnpjCpf" = $${paramIndex}`);
          valores.push(updateDataSemFoto.cnpjCpf);
          paramIndex++;
        }
        if (updateDataSemFoto.responsavel !== undefined) {
          campos.push(`responsavel = $${paramIndex}`);
          valores.push(updateDataSemFoto.responsavel);
          paramIndex++;
        }
        if (updateDataSemFoto.email !== undefined) {
          campos.push(`email = $${paramIndex}`);
          valores.push(updateDataSemFoto.email);
          paramIndex++;
        }
        if (updateDataSemFoto.telefone !== undefined) {
          campos.push(`telefone = $${paramIndex}`);
          valores.push(updateDataSemFoto.telefone);
          paramIndex++;
        }
        if (updateDataSemFoto.endereco !== undefined) {
          campos.push(`endereco = $${paramIndex}`);
          valores.push(updateDataSemFoto.endereco);
          paramIndex++;
        }
        if (updateDataSemFoto.cidade !== undefined) {
          campos.push(`cidade = $${paramIndex}`);
          valores.push(updateDataSemFoto.cidade);
          paramIndex++;
        }
        if (updateDataSemFoto.bairro !== undefined) {
          campos.push(`bairro = $${paramIndex}`);
          valores.push(updateDataSemFoto.bairro);
          paramIndex++;
        }
        if (updateDataSemFoto.cep !== undefined) {
          campos.push(`cep = $${paramIndex}`);
          valores.push(updateDataSemFoto.cep);
          paramIndex++;
        }
        if (updateDataSemFoto.modoConfirmacao !== undefined) {
          campos.push(`"modoConfirmacao" = $${paramIndex}`);
          valores.push(updateDataSemFoto.modoConfirmacao);
          paramIndex++;
        }
        if (updateDataSemFoto.status !== undefined) {
          campos.push(`status = $${paramIndex}`);
          valores.push(updateDataSemFoto.status);
          paramIndex++;
        }
        
        if (campos.length > 0) {
          campos.push(`"updatedAt" = NOW()`);
          valores.push(barbeariaId);
          
          const sql = `UPDATE "Barbearia" SET ${campos.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
          const resultado = await prisma.$queryRawUnsafe(sql, ...valores);
          barbearia = Array.isArray(resultado) ? resultado[0] : resultado;
          console.log('✅ [CONFIG BACKEND] Configuração atualizada via SQL raw (sem foto)');
        } else {
          // Se não há campos para atualizar, apenas buscar a barbearia
          barbearia = await prisma.barbearia.findUnique({
            where: { id: barbeariaId },
          });
        }
      } else {
        // Se for outro erro, re-throw
        throw updateError;
      }
    }

    console.log('✅ [CONFIG BACKEND] Configuração atualizada com sucesso');
    res.json(barbearia);
  } catch (error: any) {
    console.error('❌ [CONFIG BACKEND] Erro ao atualizar configuração:', error);
    console.error('❌ [CONFIG BACKEND] Erro tipo:', error?.name);
    console.error('❌ [CONFIG BACKEND] Erro mensagem:', error?.message);
    console.error('❌ [CONFIG BACKEND] Erro stack:', error?.stack);
    
    // Se for erro do Prisma, pode ser problema com tamanho do campo
    if (error?.code === 'P2001' || error?.message?.includes('String too long')) {
      return res.status(400).json({ error: 'Foto muito grande. Por favor, use uma imagem menor.' });
    }
    
    res.status(500).json({ error: 'Erro ao atualizar configuração' });
  }
});

export default router;
