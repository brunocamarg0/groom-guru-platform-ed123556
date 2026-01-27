import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  notificacoes: Array<{ id: string; titulo: string; mensagem: string; lida: boolean; data: string; tipo?: string; canal?: string }>;
  barbearias: any[];
  buscarBarbearias: (busca?: string, cidade?: string, bairro?: string) => Promise<void>;
  buscarBarbeariaPorId: (id: string) => Promise<any>;
  criarAvaliacao?: (dados: any) => Promise<void>;
  realizarPagamento?: (agendamentoId: string, dados: any) => Promise<Pagamento>;
  marcarNotificacaoLida?: (id: string) => Promise<void>;
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined);

export function ClienteProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  // Verificar se há token E se é um cliente antes de fazer requisições
  const [isClienteLogado, setIsClienteLogado] = useState(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    return !!token && userType === 'cliente';
  });
  
  // Atualizar isClienteLogado quando o token ou userType mudar
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      const shouldBeLogado = !!token && userType === 'cliente';
      if (shouldBeLogado !== isClienteLogado) {
        console.log('🔄 [CLIENTE CONTEXT] Estado mudou:', { token: !!token, userType, isClienteLogado: shouldBeLogado });
        setIsClienteLogado(shouldBeLogado);
      }
    };
    
    checkToken();
    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [isClienteLogado]);

  // Estado local para dados que não vêm de queries
  const [clienteLocal, setClienteLocal] = useState<Cliente | null>(null);
  const [barbearias, setBarbearias] = useState<any[]>([]);
  
  // Estado derivado para fidelidade (calculado dos agendamentos)
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

  // Carregar dados do localStorage imediatamente
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const userType = localStorage.getItem('userType');

    if (userStr && userType === 'cliente') {
      try {
        const userData = JSON.parse(userStr);
        setClienteLocal({
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

  // React Query: Buscar perfil do cliente
  const { data: perfilData, isLoading: loadingPerfil, error: errorPerfil } = useQuery({
    queryKey: ['cliente', 'perfil'],
    queryFn: () => {
      console.log('👤 [QUERY CLIENTE] Buscando perfil...');
      return apiGet<Cliente>('/cliente/perfil');
    },
    enabled: isClienteLogado,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.error('❌ [QUERY CLIENTE] Erro 401, não tentando novamente');
        // Só limpar e redirecionar se for um cliente tentando acessar
        const userType = localStorage.getItem('userType');
        if (userType === 'cliente') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          window.location.href = '/login?tab=client';
        }
        return false;
      }
      return failureCount < 2;
    },
  });

  // React Query: Buscar agendamentos do cliente
  const { data: agendamentosData, isLoading: loadingAgendamentos, error: errorAgendamentos } = useQuery({
    queryKey: ['cliente', 'agendamentos'],
    queryFn: () => {
      console.log('📅 [QUERY CLIENTE] Buscando agendamentos...');
      return apiGet<any[]>('/cliente/agendamentos');
    },
    enabled: isClienteLogado,
    staleTime: 1000 * 60 * 2, // 2 minutos de cache (agendamentos mudam mais frequentemente)
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Estados locais para agendamentos e pagamentos (derivados das queries)
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  // Processar dados do perfil quando carregados
  useEffect(() => {
    if (perfilData) {
      setClienteLocal(perfilData);
      localStorage.setItem('user', JSON.stringify(perfilData));
      console.log('✅ [CLIENTE] Perfil atualizado:', perfilData.nome);
    }
  }, [perfilData]);

  // Processar agendamentos quando carregados
  useEffect(() => {
    if (agendamentosData) {
      // Transformar agendamentos do banco para o formato do frontend
      const agendamentosFormatados: Agendamento[] = agendamentosData.map((a: any) => {
        // Extrair apenas a data (yyyy-MM-dd) usando UTC para evitar conversão de timezone
        let dataFormatada: string;
        if (a.data) {
          const dataObj = new Date(a.data);
          const ano = dataObj.getUTCFullYear();
          const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
          const dia = String(dataObj.getUTCDate()).padStart(2, '0');
          dataFormatada = `${ano}-${mes}-${dia}`;
        } else {
          dataFormatada = new Date().toISOString().split('T')[0];
        }

        return {
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
          data: dataFormatada,
          hora: a.horario || a.hora || '',
          status: a.status as StatusAgendamento,
          observacoes: a.observacao || a.observacoes || undefined,
          createdAt: a.createdAt || new Date().toISOString(),
          updatedAt: a.updatedAt || new Date().toISOString(),
        };
      });

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

      console.log('✅ [CLIENTE] Agendamentos processados:', agendamentosFormatados.length);
    }
  }, [agendamentosData]);

  // Função para recarregar dados (usada por componentes que precisam forçar refresh)
  const carregarDados = async () => {
    await queryClient.invalidateQueries({ queryKey: ['cliente'] });
  };

  // Estado de loading combinado
  const loading = loadingPerfil || loadingAgendamentos;
  
  // Cliente: usar dados da query ou fallback para localStorage
  const cliente = perfilData || clienteLocal;

  const atualizarPerfil = async (dados: Partial<Cliente>) => {
    try {
      const perfilAtualizado = await apiPut<Cliente>('/cliente/perfil', dados);
      setClienteLocal(perfilAtualizado);
      localStorage.setItem('user', JSON.stringify(perfilAtualizado));
      // Invalidar query para recarregar dados atualizados
      await queryClient.invalidateQueries({ queryKey: ['cliente', 'perfil'] });
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
        profissionalId: novoAgendamento.profissionalId,
        data: novoAgendamento.data,
        horario: novoAgendamento.hora,
        observacoes: novoAgendamento.observacoes,
      });

      // Extrair apenas a data (yyyy-MM-dd) da resposta
      // A data vem armazenada ao meio-dia UTC para evitar problemas de timezone
      let dataFormatada: string;
      if (agendamentoData.data) {
        const dataObj = new Date(agendamentoData.data);
        // Usar getUTC* para evitar conversão de timezone
        const ano = dataObj.getUTCFullYear();
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        dataFormatada = `${ano}-${mes}-${dia}`;
      } else {
        dataFormatada = new Date().toISOString().split('T')[0];
      }

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
        data: dataFormatada,
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
      console.error('❌ [CLIENTE CONTEXT] Erro ao criar agendamento:', error);
      console.error('   Status:', error.status);
      console.error('   Mensagem:', error.message);
      
      // Extrair mensagem de erro mais específica
      let mensagemErro = 'Erro ao criar agendamento';
      
      if (error.status === 401) {
        mensagemErro = 'Você precisa estar logado para criar um agendamento. Faça login novamente.';
      } else if (error.status === 400) {
        mensagemErro = error.message || 'Dados inválidos. Verifique os campos preenchidos.';
      } else if (error.status === 404) {
        mensagemErro = error.message || 'Barbearia, serviço ou profissional não encontrado.';
      } else if (error.error) {
        mensagemErro = error.error;
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      toast.error(mensagemErro);
      throw new Error(mensagemErro);
    }
  };

  const cancelarAgendamento = async (id: string) => {
    try {
      await apiPut(`/cliente/agendamentos/${id}/cancelar`, {});

      // Invalidar query para recarregar agendamentos
      await queryClient.invalidateQueries({ queryKey: ['cliente', 'agendamentos'] });

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

  const realizarPagamento = async (agendamentoId: string, dados: any): Promise<Pagamento> => {
    try {
      console.log('💳 [CLIENTE] Realizando pagamento:', { agendamentoId, dados });

      // Criar pagamento via API
      const pagamentoResponse = await apiPost<Pagamento>('/cliente/pagamentos', {
        agendamentoId,
        valor: dados.valor,
        metodo: dados.metodo,
        status: dados.status || 'pago',
        cupomDesconto: dados.cupomDesconto,
        cashbackGerado: dados.cashbackGerado || 0,
      });

      const novoPagamento: Pagamento = {
        id: pagamentoResponse.id || Date.now().toString(),
        agendamentoId,
        valor: dados.valor,
        metodo: dados.metodo,
        status: dados.status || 'aprovado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...pagamentoResponse,
      };

      // Atualizar estado local
      setPagamentos([...pagamentos, novoPagamento]);

      // Atualizar status do agendamento
      setAgendamentos(
        agendamentos.map((a) =>
          a.id === agendamentoId
            ? {
              ...a,
              status: dados.status === 'pago' ? 'confirmado' as StatusAgendamento : a.status,
              updatedAt: new Date().toISOString()
            }
            : a
        )
      );

      // Invalidar queries para recarregar dados
      await queryClient.invalidateQueries({ queryKey: ['cliente'] });

      toast.success('Pagamento realizado com sucesso!');
      return novoPagamento;
    } catch (error: any) {
      console.error('❌ [CLIENTE] Erro ao realizar pagamento:', error);
      toast.error(error.message || 'Erro ao realizar pagamento');
      throw error;
    }
  };

  const buscarBarbearias = async (busca?: string, cidade?: string, bairro?: string) => {
    try {
      console.log('🔍 [CLIENTE] Buscando barbearias...', { busca, cidade, bairro });

      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (cidade) params.append('cidade', cidade);
      if (bairro) params.append('bairro', bairro);

      const queryString = params.toString();
      const endpoint = `/barbearias${queryString ? `?${queryString}` : ''}`;

      console.log('🔍 [CLIENTE] Endpoint:', endpoint);

      // Fazer requisição sem token (rota pública)
      const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CLIENTE] Erro na resposta:', response.status, errorText);
        throw new Error(`Erro ao buscar barbearias: ${response.status} - ${errorText}`);
      }

      const barbeariasData = await response.json();

      if (Array.isArray(barbeariasData)) {
        setBarbearias(barbeariasData);
        console.log('✅ [CLIENTE] Barbearias encontradas:', barbeariasData.length);
      } else {
        console.warn('⚠️ [CLIENTE] Resposta não é um array:', barbeariasData);
        setBarbearias([]);
      }
    } catch (error: any) {
      console.error('❌ [CLIENTE] Erro ao buscar barbearias:', error);
      console.error('❌ [CLIENTE] Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      toast.error(error.message || 'Erro ao buscar barbearias');
      setBarbearias([]);
    }
  };

  const buscarBarbeariaPorId = async (id: string) => {
    try {
      console.log('🔍 [CLIENTE] Buscando barbearia por ID:', id);

      // Fazer requisição sem token (rota pública)
      const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';
      const response = await fetch(`${API_URL}/barbearias/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CLIENTE] Erro na resposta:', response.status, errorText);
        throw new Error(`Erro ao buscar barbearia: ${response.status} - ${errorText}`);
      }

      const barbearia = await response.json();
      return barbearia;
    } catch (error: any) {
      console.error('❌ [CLIENTE] Erro ao buscar barbearia:', error);
      toast.error(error.message || 'Erro ao buscar barbearia');
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
        setCliente: setClienteLocal,
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
        realizarPagamento,
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
