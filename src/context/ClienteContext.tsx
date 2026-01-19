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
      console.log('🔄 Token presente:', !!token);
      console.log('🔄 UserType:', userType);
      
      // Se já tem cliente no localStorage, usar temporariamente enquanto carrega
      const userStr = localStorage.getItem('user');
      if (userStr && !cliente) {
        try {
          const userData = JSON.parse(userStr);
          if (userData && userData.nome) {
            setCliente({
              id: userData.id,
              nome: userData.nome,
              email: userData.email,
              telefone: userData.telefone || undefined,
              dataNascimento: userData.dataNascimento || undefined,
              createdAt: userData.createdAt || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Erro ao parsear dados do localStorage:', error);
        }
      }
      
      carregarDados().catch((err) => {
        console.error('❌ Erro ao carregar dados do cliente:', err);
        setLoading(false);
      });
      
      // Carregar todas as barbearias ativas automaticamente ao fazer login
      buscarBarbearias().catch((err) => {
        console.warn('⚠️ Erro ao carregar barbearias iniciais:', err);
      });
    } else if (isClienteRoute && !token) {
      console.warn('⚠️ Token não encontrado. Redirecionando para login...');
      window.location.href = '/login?tab=client';
    }
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('📥 [CLIENTE] Carregando dados do banco...');
      console.log('📥 [CLIENTE] Token presente:', !!localStorage.getItem('token'));
      console.log('📥 [CLIENTE] UserType:', localStorage.getItem('userType'));

      // Timeout de 10 segundos para cada requisição
      const timeout = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms)
      );

      // Carregar perfil do cliente com timeout
      let perfil: Cliente | null = null;
      try {
        perfil = await Promise.race([
          apiGet<Cliente>('/cliente/perfil'),
          timeout(10000)
        ]) as Cliente;
        console.log('✅ [CLIENTE] Perfil carregado:', perfil?.nome);
      } catch (err: any) {
        console.error('❌ [CLIENTE] Erro ao carregar perfil:', err);
        console.error('❌ [CLIENTE] Erro detalhado:', {
          message: err?.message,
          status: err?.status,
          stack: err?.stack
        });
        // Se erro 401, token inválido
        if (err?.status === 401 || err?.message?.includes('401')) {
          console.error('❌ [CLIENTE] Token inválido ou expirado');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          window.location.href = '/login?tab=client';
          return;
        }
      }

      if (perfil) {
        setCliente(perfil);
        localStorage.setItem('user', JSON.stringify(perfil));
      } else {
        // Se não conseguiu carregar perfil, usar dados do localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            if (userData && userData.nome) {
              console.log('⚠️ [CLIENTE] Usando dados do localStorage como fallback');
              setCliente({
                id: userData.id,
                nome: userData.nome,
                email: userData.email,
                telefone: userData.telefone || undefined,
                dataNascimento: userData.dataNascimento || undefined,
                createdAt: userData.createdAt || new Date().toISOString(),
              });
            }
          } catch (parseError) {
            console.error('❌ [CLIENTE] Erro ao parsear localStorage:', parseError);
          }
        }
      }

      // Carregar agendamentos com timeout
      let agendamentosData: any[] = [];
      try {
        agendamentosData = await Promise.race([
          apiGet<any[]>('/cliente/agendamentos'),
          timeout(10000)
        ]) as any[];
        console.log('✅ [CLIENTE] Agendamentos carregados:', agendamentosData.length);
      } catch (err: any) {
        console.error('❌ [CLIENTE] Erro ao carregar agendamentos:', err);
        agendamentosData = [];
      }

      // Transformar agendamentos do banco para o formato do frontend
      const agendamentosFormatados: Agendamento[] = agendamentosData.map((a: any) => {
        // Converter data UTC para horário de Brasília antes de extrair a data
        const dataUTC = new Date(a.data);
        const dataBrasilia = new Date(dataUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const dataFormatada = dataBrasilia.toISOString().split('T')[0];
        
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
      console.error('❌ [CLIENTE] Erro geral ao carregar dados:', error);
      console.error('❌ [CLIENTE] Erro completo:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      // Tentar usar dados do localStorage como último recurso
      const userStr = localStorage.getItem('user');
      if (userStr && !cliente) {
        try {
          const userData = JSON.parse(userStr);
          if (userData && userData.nome) {
            console.log('⚠️ [CLIENTE] Usando dados do localStorage após erro');
            setCliente({
              id: userData.id,
              nome: userData.nome,
              email: userData.email,
              telefone: userData.telefone || undefined,
              dataNascimento: userData.dataNascimento || undefined,
              createdAt: userData.createdAt || new Date().toISOString(),
            });
          }
        } catch (parseError) {
          console.error('❌ [CLIENTE] Erro ao parsear localStorage:', parseError);
        }
      }
      
      // Não mostrar toast de erro se conseguiu usar dados do localStorage
      if (!cliente) {
        toast.error('Erro ao carregar dados do cliente. Tente fazer login novamente.');
      }
    } finally {
      // SEMPRE setar loading como false, mesmo em caso de erro
      console.log('✅ [CLIENTE] Finalizando carregamento (loading = false)');
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

      // Converter data UTC para horário de Brasília
      const dataUTC = agendamentoData.data ? new Date(agendamentoData.data) : new Date();
      const dataBrasilia = new Date(dataUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const dataFormatada = dataBrasilia.toISOString().split('T')[0];

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

      // Recarregar dados para garantir sincronização
      await carregarDados();

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
