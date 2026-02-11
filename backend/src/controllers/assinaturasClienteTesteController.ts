import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequestCliente } from '../middleware/authCliente';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/cliente/assinaturas/comprar-teste
 * Criar assinatura em modo teste (sem pagamento real)
 * Apenas para desenvolvimento/teste
 */
export async function comprarAssinaturaTeste(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { planoId, barbeariaId, profissionalId } = req.body;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    if (!planoId || !barbeariaId) {
      return res.status(400).json({ 
        error: 'planoId e barbeariaId são obrigatórios' 
      });
    }

    // Verificar se está em modo de desenvolvimento/teste
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_MODE) {
      return res.status(403).json({ error: 'Modo teste não permitido em produção' });
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se o plano pertence à barbearia e está ativo
    const plano = await prisma.planoCliente.findFirst({
      where: {
        id: planoId,
        barbeariaId,
        ativo: true,
      },
      include: {
        barbearia: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado ou inativo' });
    }

    // Verificar se o cliente já tem assinatura ativa
    const assinaturaExistente = await prisma.assinaturaCliente.findUnique({
      where: { clienteId },
    });

    if (assinaturaExistente && assinaturaExistente.status === 'ativa') {
      return res.status(400).json({ 
        error: 'Você já possui uma assinatura ativa. Cancele a atual antes de contratar uma nova.' 
      });
    }

    // Verificar se profissional pertence à barbearia (se fornecido)
    if (profissionalId) {
      const profissional = await prisma.profissional.findFirst({
        where: {
          id: profissionalId,
          barbeariaId,
        },
      });

      if (!profissional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }
    }

    // Calcular datas
    const dataInicio = new Date();
    const dataVencimento = new Date();
    dataVencimento.setMonth(dataVencimento.getMonth() + plano.duracaoMeses);
    const proximoVencimento = new Date(dataVencimento);

    // Criar assinatura (ativa imediatamente em modo teste)
    const assinatura = await prisma.assinaturaCliente.create({
      data: {
        clienteId,
        planoId,
        profissionalId: profissionalId || null,
        dataInicio,
        dataVencimento,
        proximoVencimento,
        status: 'ativa', // Ativa imediatamente em modo teste
      },
      include: {
        plano: {
          include: {
            barbearia: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    // Criar pagamento como pago (modo teste)
    const pagamento = await prisma.pagamentoAssinatura.create({
      data: {
        assinaturaId: assinatura.id,
        valor: assinatura.plano.valor,
        dataVencimento: dataInicio,
        dataPagamento: new Date(), // Pagamento imediato em modo teste
        status: 'paga',
        metodoPagamento: 'teste',
        observacoes: 'Pagamento simulado em modo teste',
      },
    });

    // Gerar comissão se houver profissional associado
    if (assinatura.profissionalId) {
      const profissional = await prisma.profissional.findUnique({
        where: { id: assinatura.profissionalId },
      });

      if (profissional && profissional.comissaoAssinatura > 0) {
        const dataPagamento = new Date();
        const mesReferencia = `${dataPagamento.getFullYear()}-${String(dataPagamento.getMonth() + 1).padStart(2, '0')}`;

        await prisma.comissaoAssinatura.create({
          data: {
            profissionalId: profissional.id,
            assinaturaId: assinatura.id,
            pagamentoId: pagamento.id,
            valorComissao: profissional.comissaoAssinatura,
            valorTotal: pagamento.valor,
            mesReferencia,
            barbeariaId,
            pago: false, // Comissão ainda não foi paga ao profissional
          },
        });
      }
    }

    console.log('✅ [TESTE] Assinatura criada em modo teste:', assinatura.id);
    console.log('   Cliente:', cliente.nome);
    console.log('   Plano:', plano.nome);
    console.log('   Valor:', plano.valor);

    res.json({
      assinatura: {
        id: assinatura.id,
        status: assinatura.status,
        plano: assinatura.plano,
        dataInicio: assinatura.dataInicio,
        dataVencimento: assinatura.dataVencimento,
      },
      pagamento: {
        id: pagamento.id,
        status: pagamento.status,
        valor: pagamento.valor,
        metodoPagamento: 'teste',
      },
      modo: 'teste',
      mensagem: 'Assinatura criada em modo teste. Pagamento simulado como aprovado.',
    });
  } catch (error: any) {
    console.error('Erro ao criar assinatura de teste:', error);
    res.status(500).json({ error: 'Erro ao processar assinatura de teste' });
  }
}

/**
 * POST /api/dono/assinaturas-cliente/:id/simular-pagamento
 * Simular pagamento de uma assinatura (apenas para teste)
 */
export async function simularPagamentoAssinatura(req: AuthRequest, res: Response) {
  try {
    const { barbeariaId } = req;
    const { id } = req.params;

    if (!barbeariaId) {
      return res.status(401).json({ error: 'Barbearia não identificada' });
    }

    // Verificar se está em modo de desenvolvimento/teste
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_MODE) {
      return res.status(403).json({ error: 'Modo teste não permitido em produção' });
    }

    // Buscar assinatura
    const assinatura = await prisma.assinaturaCliente.findFirst({
      where: {
        id,
        plano: {
          barbeariaId,
        },
      },
      include: {
        plano: true,
        profissional: true,
      },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Buscar próximo pagamento pendente
    const proximoPagamento = await prisma.pagamentoAssinatura.findFirst({
      where: {
        assinaturaId: id,
        status: 'pendente',
      },
      orderBy: {
        dataVencimento: 'asc',
      },
    });

    if (!proximoPagamento) {
      return res.status(400).json({ error: 'Não há pagamentos pendentes para esta assinatura' });
    }

    // Atualizar pagamento e gerar comissão em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Atualizar pagamento
      const pagamentoAtualizado = await tx.pagamentoAssinatura.update({
        where: { id: proximoPagamento.id },
        data: {
          status: 'paga',
          dataPagamento: new Date(),
          metodoPagamento: 'teste',
          observacoes: 'Pagamento simulado em modo teste',
        },
      });

      // Atualizar assinatura para ativa se estava pendente
      if (assinatura.status === 'pendente') {
        await tx.assinaturaCliente.update({
          where: { id },
          data: {
            status: 'ativa',
          },
        });
      }

      // Gerar comissão se houver profissional associado
      if (assinatura.profissionalId && assinatura.profissional) {
        const profissional = assinatura.profissional;
        const valorComissao = profissional.comissaoAssinatura || 0;

        if (valorComissao > 0) {
          const dataPagamento = new Date();
          const mesReferencia = `${dataPagamento.getFullYear()}-${String(dataPagamento.getMonth() + 1).padStart(2, '0')}`;

          await tx.comissaoAssinatura.upsert({
            where: {
              pagamentoId_profissionalId: {
                pagamentoId: proximoPagamento.id,
                profissionalId: profissional.id,
              },
            },
            update: {
              pago: false,
              valorComissao,
              valorTotal: pagamentoAtualizado.valor,
            },
            create: {
              profissionalId: profissional.id,
              assinaturaId: id,
              pagamentoId: proximoPagamento.id,
              valorComissao,
              valorTotal: pagamentoAtualizado.valor,
              mesReferencia,
              barbeariaId,
            },
          });
        }
      }

      return pagamentoAtualizado;
    });

    res.json({
      pagamento: resultado,
      mensagem: 'Pagamento simulado com sucesso',
      modo: 'teste',
    });
  } catch (error: any) {
    console.error('Erro ao simular pagamento:', error);
    res.status(500).json({ error: 'Erro ao simular pagamento' });
  }
}

