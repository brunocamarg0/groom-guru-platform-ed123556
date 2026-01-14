import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Agendamento,
  Cliente,
  Servico,
  NovoAgendamento,
  StatusAgendamento,
  Pagamento,
  MetodoPagamento,
  StatusPagamento,
} from "@/types/cliente";
import { apiGet, apiPost, apiPut } from "@/services/api";
import { toast } from "sonner";

interface ClienteContextType {
  cliente: Cliente | null;
  agendamentos: Agendamento[];
  servicos: Servico[];
  pagamentos: Pagamento[];
  loading: boolean;
  setCliente: (cliente: Cliente | null) => void;
  criarAgendamento: (agendamento: NovoAgendamento) => Promise<Agendamento>;
  cancelarAgendamento: (id: string) => Promise<void>;
  criarPagamento: (
    agendamentoId: string,
    valor: number,
    metodo: MetodoPagamento
  ) => Promise<Pagamento>;
  atualizarStatusPagamento: (id: string, status: StatusPagamento) => Promise<void>;
  getAgendamento: (id: string) => Agendamento | undefined;
  getAgendamentosPorStatus: (status: StatusAgendamento) => Agendamento[];
  getServicosPorBarbearia: (barbeariaId: string) => Servico[];
  carregarDados: () => Promise<void>;
  atualizarPerfil: (dados: Partial<Cliente>) => Promise<void>;
  getProximoAgendamento: () => Agendamento | null;
  fidelidade: {
    pontos: number;
    nivel: string;
    cortesRealizados: number;
    proximoDesconto: {
      cortesNecessarios: number;
      desconto: number;
    };
    progressoProximoNivel: number;
  };
  notificacoes: Array<{ id: string; titulo: string; mensagem: string; lida: boolean; data: string }>;
  barbearias: any[];
  buscarBarbearias: (busca?: string) => Promise<void>;
  buscarBarbeariaPorId: (id: string) => Promise<any>;
  criarAvaliacao?: (dados: any) => Promise<void>;
  realizarPagamento?: (agendamentoId: string, dados: any) => Promise<void>;
  marcarNotificacaoLida?: (id: string) => Promise<void>;
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [barbearias, setBarbearias] = useState<any[]>([]);
  const [fidelidade, setFidelidade] = useState({
    pontos: 0,
    nivel: 'Bronze',
    cortesRealizados: 0,
    proximoDesconto: {
      cortesNecessarios: 5,
      desconto: 10,
    },
    progressoProximoNivel: 0,
  });

  // Carregar dados do cliente do localStorage e do banco
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const userType = localStorage.getItem('userType');
    
    if (userStr && userType === 'cliente') {
      try {
        const userData = JSON.parse(userStr);
        setCliente({
          id: userData.id,
          nome: userData.nome,
          email: userData.email,
          telefone: userData.telefone || undefined,
          dataNascimento: userData.dataNascimento || undefined,
          createdAt: userData.createdAt || new Date().toISOString(),
        });
      } catch (error) {
        console.error('Erro ao parsear dados do cliente:', error);
      }
    }
  }, []);

  // Carregar dados da API quando estiver na rota /cliente
  useEffect(() => {
    const currentPath = window.location.pathname;
    const isClienteRoute = currentPath.startsWith('/cliente');
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (isClienteRoute && token && userType === 'cliente') {
      console.log('🔄 Carregando dados do cliente do banco...');
      carregarDados();
    } else if (isClienteRoute && !token) {
      console.warn('⚠️ Token não encontrado. Redirecionando para login...');
      window.location.href = '/login';
    }
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('📥 [CLIENTE] Carregando dados do banco...');

      // Carregar perfil do cliente
      const perfil = await apiGet<Cliente>('/cliente/perfil').catch((err) => {
        console.warn('⚠️ Erro ao carregar perfil:', err);
        return null;
      });

      if (perfil) {
        setCliente(perfil);
        localStorage.setItem('user', JSON.stringify(perfil));
      }

      // Carregar agendamentos
      const agendamentosData = await apiGet<any[]>('/cliente/agendamentos').catch((err) => {
        console.warn('⚠️ Erro ao carregar agendamentos:', err);
        return [];
      });

      // Transformar agendamentos do banco para o formato do frontend
      const agendamentosFormatados: Agendamento[] = agendamentosData.map((a: any) => ({
        id: a.id,
        clienteId: a.clienteId,
        barbeariaId: a.barbeariaId,
        servicoId: a.servicoId,
        servico: {
          id: a.servico.id,
          nome: a.servico.nome,
          descricao: a.servico.descricao || undefined,
          duracao: a.servico.duracao,
          preco: a.servico.preco,
          barbeariaId: a.servico.barbeariaId,
          ativo: a.servico.ativo,
        },
        data: a.data ? new Date(a.data).toISOString().split('T')[0] : '',
        hora: a.horario || a.hora || '',
        status: a.status as StatusAgendamento,
        observacoes: a.observacao || a.observacoes || undefined,
        createdAt: a.createdAt || new Date().toISOString(),
        updatedAt: a.updatedAt || new Date().toISOString(),
      }));

      setAgendamentos(agendamentosFormatados);

      // Carregar pagamentos dos agendamentos
      const pagamentosData: Pagamento[] = agendamentosData
        .filter((a: any) => a.pagamento)
        .map((a: any) => ({
          id: a.pagamento.id,
          agendamentoId: a.id,
          valor: a.pagamento.valor,
          metodo: a.pagamento.metodo as MetodoPagamento,
          status: a.pagamento.status as StatusPagamento,
          createdAt: a.pagamento.createdAt || new Date().toISOString(),
          updatedAt: a.pagamento.updatedAt || new Date().toISOString(),
        }));

      setPagamentos(pagamentosData);

      // Calcular pontos de fidelidade baseado em agendamentos concluídos
      const agendamentosConcluidos = agendamentosFormatados.filter(
        (a) => a.status === 'concluido'
      ).length;
      
      const pontos = agendamentosConcluidos * 10;
      const nivel = agendamentosConcluidos >= 10 ? 'Ouro' : agendamentosConcluidos >= 5 ? 'Prata' : 'Bronze';
      const proximoCorte = agendamentosConcluidos % 5;
      const cortesNecessarios = 5 - proximoCorte;
      
      setFidelidade({
        pontos,
        nivel,
        cortesRealizados: agendamentosConcluidos,
        proximoDesconto: {
          cortesNecessarios: cortesNecessarios === 0 ? 5 : cortesNecessarios,
          desconto: nivel === 'Ouro' ? 15 : nivel === 'Prata' ? 10 : 5,
        },
        progressoProximoNivel: (proximoCorte / 5) * 100,
      });

      console.log('✅ [CLIENTE] Dados carregados:', {
        perfil: !!perfil,
        agendamentos: agendamentosFormatados.length,
        pagamentos: pagamentosData.length,
        fidelidade: {
          pontos,
          nivel,
          cortesRealizados: agendamentosConcluidos,
        },
      });
    } catch (error: any) {
      console.error('❌ [CLIENTE] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const atualizarPerfil = async (dados: Partial<Cliente>) => {
    try {
      const perfilAtualizado = await apiPut<Cliente>('/cliente/perfil', dados);
      setCliente(perfilAtualizado);
      localStorage.setItem('user', JSON.stringify(perfilAtualizado));
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
      throw error;
    }
  };

  const criarAgendamento = async (novoAgendamento: NovoAgendamento): Promise<Agendamento> => {
    try {
      console.log('➕ [CLIENTE] Criando agendamento:', novoAgendamento);
      
      const agendamentoData = await apiPost<any>('/cliente/agendamentos', {
        barbeariaId: novoAgendamento.barbeariaId,
        servicoId: novoAgendamento.servicoId,
        data: novoAgendamento.data,
        horario: novoAgendamento.hora,
        observacoes: novoAgendamento.observacoes,
      });

      // Transformar resposta para o formato do frontend
      const agendamento: Agendamento = {
        id: agendamentoData.id,
        clienteId: agendamentoData.clienteId,
        barbeariaId: agendamentoData.barbeariaId,
        servicoId: agendamentoData.servicoId,
        servico: {
          id: agendamentoData.servico.id,
          nome: agendamentoData.servico.nome,
          descricao: agendamentoData.servico.descricao || undefined,
          duracao: agendamentoData.servico.duracao,
          preco: agendamentoData.servico.preco,
          barbeariaId: agendamentoData.servico.barbeariaId,
          ativo: agendamentoData.servico.ativo,
        },
        data: agendamentoData.data ? new Date(agendamentoData.data).toISOString().split('T')[0] : '',
        hora: agendamentoData.horario || agendamentoData.hora || '',
        status: agendamentoData.status as StatusAgendamento,
        observacoes: agendamentoData.observacao || agendamentoData.observacoes || undefined,
        createdAt: agendamentoData.createdAt || new Date().toISOString(),
        updatedAt: agendamentoData.updatedAt || new Date().toISOString(),
      };

      setAgendamentos([...agendamentos, agendamento]);
      toast.success('Agendamento criado com sucesso!');
      
      return agendamento;
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao criar agendamento');
      throw error;
    }
  };

  const cancelarAgendamento = async (id: string) => {
    try {
      await apiPut(`/cliente/agendamentos/${id}/cancelar`, {});
      
      setAgendamentos(
        agendamentos.map((a) =>
          a.id === id ? { ...a, status: 'cancelado' as StatusAgendamento, updatedAt: new Date().toISOString() } : a
        )
      );
      
      toast.success('Agendamento cancelado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error(error.message || 'Erro ao cancelar agendamento');
      throw error;
    }
  };

  const criarPagamento = async (
    agendamentoId: string,
    valor: number,
    metodo: MetodoPagamento
  ): Promise<Pagamento> => {
    try {
      // TODO: Implementar criação de pagamento via API
      // Por enquanto, criar localmente
      const pagamento: Pagamento = {
        id: Date.now().toString(),
        agendamentoId,
        valor,
        metodo,
        status: metodo === "pix" || metodo === "boleto" ? "pendente" : "processando",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPagamentos([...pagamentos, pagamento]);

      // Atualizar status do agendamento
      setAgendamentos(
        agendamentos.map((a) =>
          a.id === agendamentoId
            ? { ...a, status: "confirmado" as StatusAgendamento, updatedAt: new Date().toISOString() }
            : a
        )
      );

      toast.success('Pagamento criado com sucesso!');
      return pagamento;
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      toast.error(error.message || 'Erro ao criar pagamento');
      throw error;
    }
  };

  const atualizarStatusPagamento = async (id: string, status: StatusPagamento) => {
    try {
      setPagamentos(
        pagamentos.map((p) =>
          p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
        )
      );

      const pagamento = pagamentos.find((p) => p.id === id);
      if (pagamento && status === "aprovado") {
        setAgendamentos(
          agendamentos.map((a) =>
            a.id === pagamento.agendamentoId
              ? { ...a, status: "confirmado" as StatusAgendamento, updatedAt: new Date().toISOString() }
              : a
          )
        );
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status do pagamento:', error);
      toast.error(error.message || 'Erro ao atualizar status do pagamento');
      throw error;
    }
  };

  const getAgendamento = (id: string): Agendamento | undefined => {
    return agendamentos.find((a) => a.id === id);
  };

  const getServicosPorBarbearia = (barbeariaId: string): Servico[] => {
    return servicos.filter((s) => s.barbeariaId === barbeariaId && s.ativo);
  };

  const getAgendamentosPorStatus = (status: StatusAgendamento): Agendamento[] => {
    return agendamentos.filter((a) => a.status === status);
  };

  const buscarBarbearias = async (busca?: string) => {
    try {
      console.log('🔍 [CLIENTE] Buscando barbearias...', busca ? `com busca: ${busca}` : 'todas');
      
      const params = busca ? `?busca=${encodeURIComponent(busca)}` : '';
      const barbeariasData = await apiGet<any[]>(`/barbearias${params}`);
      
      setBarbearias(barbeariasData);
      console.log('✅ [CLIENTE] Barbearias encontradas:', barbeariasData.length);
    } catch (error: any) {
      console.error('❌ [CLIENTE] Erro ao buscar barbearias:', error);
      toast.error('Erro ao buscar barbearias');
      setBarbearias([]);
    }
  };

  const buscarBarbeariaPorId = async (id: string) => {
    try {
      console.log('🔍 [CLIENTE] Buscando barbearia por ID:', id);
      const barbearia = await apiGet<any>(`/barbearias/${id}`);
      return barbearia;
    } catch (error: any) {
      console.error('❌ [CLIENTE] Erro ao buscar barbearia:', error);
      toast.error('Erro ao buscar barbearia');
      throw error;
    }
  };

  const getProximoAgendamento = (): Agendamento | null => {
    const agora = new Date();
    const agendamentosFuturos = agendamentos
      .filter((a) => {
        const dataAgendamento = new Date(`${a.data}T${a.hora}`);
        return dataAgendamento > agora && a.status !== 'cancelado';
      })
      .sort((a, b) => {
        const dataA = new Date(`${a.data}T${a.hora}`);
        const dataB = new Date(`${b.data}T${b.hora}`);
        return dataA.getTime() - dataB.getTime();
      });

    return agendamentosFuturos[0] || null;
  };

  return (
    <ClienteContext.Provider
      value={{
        cliente,
        agendamentos,
        servicos,
        pagamentos,
        loading,
        setCliente,
        criarAgendamento,
        cancelarAgendamento,
        criarPagamento,
        atualizarStatusPagamento,
        getAgendamento,
        getAgendamentosPorStatus,
        getServicosPorBarbearia,
        carregarDados,
        atualizarPerfil,
        getProximoAgendamento,
        fidelidade,
        notificacoes,
        barbearias,
        buscarBarbearias,
        buscarBarbeariaPorId,
        criarAvaliacao: undefined, // TODO: Implementar
        realizarPagamento: undefined, // TODO: Implementar
        marcarNotificacaoLida: undefined, // TODO: Implementar
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const context = useContext(ClienteContext);
  if (!context) {
    throw new Error("useCliente deve ser usado dentro de ClienteProvider");
  }
  return context;
}
