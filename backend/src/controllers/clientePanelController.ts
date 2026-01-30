import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequestCliente } from '../middleware/authCliente';
import { hashSenha, compararSenha } from '../utils/password';

/**
 * Obter perfil do cliente logado
 */
export async function obterPerfil(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        foto: true,
        dataNascimento: true,
        createdAt: true,
        ativo: true,
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao obter perfil do cliente:', error);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
}

/**
 * Atualizar perfil do cliente
 */
export async function atualizarPerfil(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { nome, telefone, dataNascimento, foto } = req.body;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        ...(nome && { nome }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(dataNascimento && { dataNascimento: new Date(dataNascimento) }),
        ...(foto !== undefined && { foto: foto || null }),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        foto: true,
        dataNascimento: true,
        createdAt: true,
      },
    });

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar perfil do cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}

/**
 * Listar agendamentos do cliente logado
 */
export async function listarMeusAgendamentos(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { status } = req.query;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const where: any = {
      clienteId,
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Limitar a 100 agendamentos mais recentes para melhor performance
    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            duracao: true,
            preco: true,
          },
        },
        pagamento: {
          select: {
            id: true,
            valor: true,
            metodo: true,
            status: true,
            dataPagamento: true,
          },
        },
        profissionais: {
          take: 1, // Limitar a 1 profissional por agendamento (geralmente só tem 1)
          include: {
            profissional: {
              select: {
                id: true,
                nome: true,
                foto: true,
              },
            },
          },
        },
      },
      orderBy: { data: 'desc' },
      take: 100, // Limitar a 100 agendamentos mais recentes
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao listar agendamentos do cliente:', error);
    res.status(500).json({ error: 'Erro ao listar agendamentos' });
  }
}

/**
 * Buscar agendamento específico do cliente
 */
export async function buscarMeuAgendamento(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { id } = req.params;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        clienteId, // Garantir que o agendamento pertence ao cliente
      },
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            duracao: true,
            preco: true,
          },
        },
        pagamento: {
          select: {
            id: true,
            valor: true,
            metodo: true,
            status: true,
            dataPagamento: true,
          },
        },
        profissionais: {
          include: {
            profissional: {
              select: {
                id: true,
                nome: true,
                foto: true,
              },
            },
          },
        },
        barbearia: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            endereco: true,
          },
        },
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento do cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
}

/**
 * Criar novo agendamento (cliente)
 */
export async function criarMeuAgendamento(req: AuthRequestCliente, res: Response) {
  try {
    console.log('📅 [CLIENTE PANEL] Criando agendamento...');
    console.log('   Cliente ID:', req.userId);
    console.log('   Body:', JSON.stringify(req.body, null, 2));

    const clienteId = req.userId;
    const { barbeariaId, servicoId, data, horario, observacoes, profissionalId } = req.body;

    if (!clienteId) {
      console.error('❌ [CLIENTE PANEL] Cliente não autenticado');
      return res.status(401).json({ error: 'Cliente não autenticado. Faça login novamente.' });
    }

    if (!barbeariaId || !servicoId || !data || !horario) {
      const camposFaltando = [];
      if (!barbeariaId) camposFaltando.push('barbeariaId');
      if (!servicoId) camposFaltando.push('servicoId');
      if (!data) camposFaltando.push('data');
      if (!horario) camposFaltando.push('horario');
      
      console.error('❌ [CLIENTE PANEL] Campos obrigatórios faltando:', camposFaltando);
      return res.status(400).json({ 
        error: `Campos obrigatórios faltando: ${camposFaltando.join(', ')}` 
      });
    }

    // Buscar dados do cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      console.error('❌ [CLIENTE PANEL] Cliente não encontrado no banco:', clienteId);
      return res.status(404).json({ error: 'Cliente não encontrado. Verifique sua conta.' });
    }

    // Verificar se barbearia existe
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      select: { id: true, nome: true },
    });

    if (!barbearia) {
      console.error('❌ [CLIENTE PANEL] Barbearia não encontrada:', barbeariaId);
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    // Verificar se serviço existe
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: { id: true, nome: true, ativo: true },
    });

    if (!servico) {
      console.error('❌ [CLIENTE PANEL] Serviço não encontrado:', servicoId);
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    if (!servico.ativo) {
      console.error('❌ [CLIENTE PANEL] Serviço inativo:', servicoId);
      return res.status(400).json({ error: 'Este serviço não está mais disponível' });
    }

    // Verificar se profissional existe (se informado)
    if (profissionalId) {
      const profissional = await prisma.profissional.findUnique({
        where: { id: profissionalId },
        select: { id: true, nome: true, ativo: true, barbeariaId: true },
      });

      if (!profissional) {
        console.error('❌ [CLIENTE PANEL] Profissional não encontrado:', profissionalId);
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }

      if (!profissional.ativo) {
        console.error('❌ [CLIENTE PANEL] Profissional inativo:', profissionalId);
        return res.status(400).json({ error: 'Este profissional não está mais disponível' });
      }

      if (profissional.barbeariaId !== barbeariaId) {
        console.error('❌ [CLIENTE PANEL] Profissional não pertence à barbearia');
        return res.status(400).json({ error: 'Profissional não pertence a esta barbearia' });
      }
    }

    // Usar meio-dia UTC para evitar problemas de timezone
    // O horário real é armazenado no campo 'horario' separadamente
    const dataHora = new Date(`${data}T12:00:00.000Z`);

    console.log('✅ [CLIENTE PANEL] Dados validados, criando agendamento...');

    // Validar telefone (campo obrigatório no schema)
    if (!cliente.telefone || cliente.telefone.trim() === '') {
      console.error('❌ [CLIENTE PANEL] Cliente sem telefone cadastrado');
      return res.status(400).json({ 
        error: 'Telefone não cadastrado. Por favor, atualize seu perfil com um número de telefone.' 
      });
    }

    // Criar agendamento
    // Nota: formaPagamento será definido apenas quando o cliente escolher a forma de pagamento
    // Por enquanto, não incluímos esse campo para evitar erro se a coluna não existir no banco
    let agendamento;
    try {
      agendamento = await prisma.agendamento.create({
        data: {
          clienteId,
          cliente: cliente.nome,
          telefone: cliente.telefone,
          barbeariaId,
          servicoId,
          data: dataHora,
          horario,
          observacao: observacoes || null,
          status: 'pendente',
        },
      });
    } catch (prismaError: any) {
      // Se o erro for porque a coluna formaPagamento não existe, tentar sem ela
      if (prismaError.code === 'P2022' && prismaError.meta?.column?.includes('formaPagamento')) {
        console.warn('⚠️ [CLIENTE PANEL] Coluna formaPagamento não existe, criando agendamento sem ela');
        agendamento = await prisma.agendamento.create({
          data: {
            clienteId,
            cliente: cliente.nome,
            telefone: cliente.telefone,
            barbeariaId,
            servicoId,
            data: dataHora,
            horario,
            observacao: observacoes || null,
            status: 'pendente',
          },
        });
      } else {
        throw prismaError;
      }
    }

    console.log('✅ [CLIENTE PANEL] Agendamento criado:', agendamento.id);

    // Se houver profissional, associar
    if (profissionalId) {
      try {
        await prisma.agendamentoProfissional.create({
          data: {
            agendamentoId: agendamento.id,
            profissionalId,
          },
        });
        console.log('✅ [CLIENTE PANEL] Profissional associado ao agendamento');
      } catch (profError: any) {
        console.error('⚠️ [CLIENTE PANEL] Erro ao associar profissional:', profError);
        // Não falha o agendamento se não conseguir associar o profissional
      }
    }

    // Buscar agendamento completo
    const agendamentoCompleto = await prisma.agendamento.findUnique({
      where: { id: agendamento.id },
      include: {
        servico: true,
        profissionais: {
          include: {
            profissional: true,
          },
        },
      },
    });

    console.log('✅ [CLIENTE PANEL] Agendamento retornado com sucesso');
    res.status(201).json(agendamentoCompleto);
  } catch (error: any) {
    console.error('❌ [CLIENTE PANEL] Erro ao criar agendamento:', error);
    console.error('   Tipo:', error.name);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    
    // Retornar mensagem de erro mais específica
    let mensagemErro = 'Erro ao criar agendamento';
    
    if (error.code === 'P2002') {
      mensagemErro = 'Já existe um agendamento com estes dados';
    } else if (error.code === 'P2003') {
      mensagemErro = 'Dados inválidos. Verifique se a barbearia e serviço existem.';
    } else if (error.message) {
      mensagemErro = error.message;
    }
    
    res.status(500).json({ 
      error: mensagemErro,
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Criar pagamento para um agendamento
 */
export async function criarPagamento(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { agendamentoId, valor, metodo, status, cupomDesconto, cashbackGerado } = req.body;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    if (!agendamentoId || !valor || !metodo) {
      return res.status(400).json({ error: 'Dados incompletos para criar pagamento' });
    }

    // Verificar se o agendamento pertence ao cliente
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: agendamentoId,
        clienteId,
      },
      include: {
        servico: true,
        pagamento: true,
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado ou não pertence a você' });
    }

    // Verificar se já existe pagamento
    if (agendamento.pagamento) {
      return res.status(400).json({ error: 'Este agendamento já possui um pagamento' });
    }

    // Criar pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        agendamentoId,
        valor: parseFloat(valor),
        metodo,
        status: status || 'pago',
        dataPagamento: status === 'pago' ? new Date() : null,
        taxaGateway: metodo === 'pix' ? 0 : valor * 0.039, // 3.9% para cartão
      },
      include: {
        agendamento: {
          include: {
            servico: true,
          },
        },
      },
    });

    // Atualizar status do agendamento se pagamento foi aprovado
    if (status === 'pago') {
      await prisma.agendamento.update({
        where: { id: agendamentoId },
        data: { status: 'confirmado' },
      });
    }

    res.status(201).json(pagamento);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
}

/**
 * Cancelar agendamento do cliente
 */
export async function cancelarMeuAgendamento(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;
    const { id } = req.params;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    // Verificar se o agendamento pertence ao cliente
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        clienteId,
        status: { in: ['pendente', 'confirmado'] }, // Só pode cancelar pendentes ou confirmados
      },
    });

    if (!agendamento) {
      return res.status(404).json({ error: 'Agendamento não encontrado ou não pode ser cancelado' });
    }

    // Atualizar status
    const agendamentoCancelado = await prisma.agendamento.update({
      where: { id },
      data: { status: 'cancelado' },
      include: {
        servico: true,
      },
    });

    res.json(agendamentoCancelado);
  } catch (error) {
    console.error('Erro ao cancelar agendamento do cliente:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
}

/**
 * Alterar senha do cliente
 */
export async function alterarSenha(req: AuthRequestCliente, res: Response) {
  try {
    console.log('🔐 [CLIENTE PANEL] Alterar senha: Iniciando...');
    
    const clienteId = req.userId;
    const { senhaAtual, novaSenha } = req.body;

    if (!clienteId) {
      console.error('❌ [CLIENTE PANEL] Cliente não autenticado');
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    if (!senhaAtual || !novaSenha) {
      console.error('❌ [CLIENTE PANEL] Campos obrigatórios faltando');
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 6) {
      console.error('❌ [CLIENTE PANEL] Nova senha muito curta');
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    console.log('🔐 [CLIENTE PANEL] Buscando cliente no banco...');
    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        email: true,
        senha: true,
      },
    });

    if (!cliente) {
      console.error('❌ [CLIENTE PANEL] Cliente não encontrado no banco');
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    console.log('🔐 [CLIENTE PANEL] Cliente encontrado:', cliente.email);

    if (!cliente.senha) {
      console.error('❌ [CLIENTE PANEL] Conta não possui senha cadastrada');
      return res.status(400).json({ error: 'Esta conta não possui senha cadastrada. Use o login com Google.' });
    }

    console.log('🔐 [CLIENTE PANEL] Verificando senha atual...');
    // Verificar senha atual
    const senhaValida = await compararSenha(senhaAtual, cliente.senha);

    if (!senhaValida) {
      console.error('❌ [CLIENTE PANEL] Senha atual incorreta');
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    console.log('🔐 [CLIENTE PANEL] Senha atual válida, gerando hash da nova senha...');
    // Hash da nova senha
    const novaSenhaHash = await hashSenha(novaSenha);

    console.log('🔐 [CLIENTE PANEL] Atualizando senha no banco...');
    // Atualizar senha
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { senha: novaSenhaHash },
    });

    console.log('✅ [CLIENTE PANEL] Senha alterada com sucesso!');
    res.json({
      sucesso: true,
      mensagem: 'Senha alterada com sucesso!',
    });
  } catch (error: any) {
    console.error('❌ [CLIENTE PANEL] Erro ao alterar senha:', error);
    console.error('   Stack:', error.stack);
    console.error('   Mensagem:', error.message);
    
    res.status(500).json({ 
      error: 'Erro ao alterar senha',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Excluir conta do cliente (LGPD)
 */
/**
 * Obter assinatura do cliente logado
 */
export async function obterMinhaAssinatura(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    const assinatura = await prisma.assinaturaCliente.findUnique({
      where: { clienteId },
      include: {
        plano: true,
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    res.json(assinatura);
  } catch (error) {
    console.error('Erro ao obter assinatura do cliente:', error);
    res.status(500).json({ error: 'Erro ao obter assinatura' });
  }
}

/**
 * Listar pagamentos da assinatura do cliente
 */
export async function listarPagamentosAssinatura(req: AuthRequestCliente, res: Response) {
  try {
    const clienteId = req.userId;

    if (!clienteId) {
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    // Buscar assinatura do cliente
    const assinatura = await prisma.assinaturaCliente.findUnique({
      where: { clienteId },
    });

    if (!assinatura) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Buscar pagamentos da assinatura
    const pagamentos = await prisma.pagamentoAssinatura.findMany({
      where: { assinaturaId: assinatura.id },
      orderBy: {
        dataVencimento: 'desc',
      },
    });

    res.json(pagamentos);
  } catch (error) {
    console.error('Erro ao listar pagamentos da assinatura:', error);
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
}

export async function excluirConta(req: AuthRequestCliente, res: Response) {
  try {
    console.log('🗑️ [CLIENTE PANEL] Excluir conta: Iniciando...');
    
    const clienteId = req.userId;

    if (!clienteId) {
      console.error('❌ [CLIENTE PANEL] Cliente não autenticado');
      return res.status(401).json({ error: 'Cliente não autenticado' });
    }

    console.log('🔍 [CLIENTE PANEL] Verificando se cliente existe...');
    // Verificar se cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        email: true,
        nome: true,
      },
    });

    if (!cliente) {
      console.error('❌ [CLIENTE PANEL] Cliente não encontrado');
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    console.log('🗑️ [CLIENTE PANEL] Excluindo agendamentos do cliente...');
    // Excluir agendamentos relacionados (cascade)
    await prisma.agendamento.deleteMany({
      where: { clienteId },
    });

    console.log('🗑️ [CLIENTE PANEL] Excluindo pagamentos relacionados...');
    // Excluir pagamentos relacionados através dos agendamentos
    // (já devem ser excluídos em cascade, mas garantindo)
    const agendamentosIds = await prisma.agendamento.findMany({
      where: { clienteId },
      select: { id: true },
    });

    if (agendamentosIds.length > 0) {
      await prisma.pagamento.deleteMany({
        where: {
          agendamentoId: {
            in: agendamentosIds.map(a => a.id),
          },
        },
      });
    }

    console.log('🗑️ [CLIENTE PANEL] Excluindo conta do cliente...');
    // Excluir conta do cliente
    await prisma.cliente.delete({
      where: { id: clienteId },
    });

    console.log('✅ [CLIENTE PANEL] Conta excluída com sucesso!');
    res.json({
      sucesso: true,
      mensagem: 'Conta excluída com sucesso conforme LGPD',
    });
  } catch (error: any) {
    console.error('❌ [CLIENTE PANEL] Erro ao excluir conta:', error);
    console.error('   Stack:', error.stack);
    console.error('   Mensagem:', error.message);
    
    res.status(500).json({ 
      error: 'Erro ao excluir conta',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

