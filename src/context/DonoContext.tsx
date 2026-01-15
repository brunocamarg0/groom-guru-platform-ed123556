import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  KPI,
  AgendamentoDono,
  ProfissionalDono,
  ClienteDono,
  PagamentoDono,
  PromocaoDono,
  AvaliacaoDono,
  ProdutoDono,
  NotificacaoDono,
  ConfiguracaoBarbearia,
  RelatorioDono,
} from "@/types/dono";
import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api";
import { toast } from "sonner";

// Função para decodificar JWT e obter barbeariaId
function obterBarbeariaIdDoToken(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Decodificar JWT (sem verificar assinatura, apenas para obter dados)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.barbeariaId || null;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

interface DonoContextType {
  // Dados
  kpi: KPI;
  agendamentos: AgendamentoDono[];
  profissionais: ProfissionalDono[];
  clientes: ClienteDono[];
  pagamentos: PagamentoDono[];
  promocoes: PromocaoDono[];
  avaliacoes: AvaliacaoDono[];
  produtos: ProdutoDono[];
  notificacoes: NotificacaoDono[];
  configuracao: ConfiguracaoBarbearia;
  
  // Funções
  criarAgendamento: (agendamento: Omit<AgendamentoDono, "id" | "dataCriacao">) => Promise<void>;
  atualizarAgendamento: (id: string, dados: Partial<AgendamentoDono>) => Promise<void>;
  cancelarAgendamento: (id: string) => Promise<void>;
  confirmarAgendamento: (id: string) => Promise<void>;
  recusarAgendamento: (id: string, motivo?: string) => Promise<void>;
  
  adicionarProfissional: (profissional: Omit<ProfissionalDono, "id" | "dataAdmissao" | "avaliacaoMedia" | "totalAvaliacoes" | "faturamentoTotal" | "faltas">) => Promise<void>;
  atualizarProfissional: (id: string, dados: Partial<ProfissionalDono>) => Promise<void>;
  removerProfissional: (id: string) => Promise<void>;
  
  adicionarCliente: (cliente: Omit<ClienteDono, "id" | "dataCadastro" | "totalAgendamentos" | "ticketMedio" | "frequencia">) => Promise<void>;
  atualizarCliente: (id: string, dados: Partial<ClienteDono>) => Promise<void>;
  marcarClienteVIP: (id: string, vip: boolean) => void;
  
  // Funções de serviços
  servicos: any[];
  adicionarServico: (servico: { nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }) => Promise<void>;
  atualizarServico: (id: string, dados: Partial<{ nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }>) => Promise<void>;
  removerServico: (id: string) => Promise<void>;
  toggleServicoAtivo: (id: string) => Promise<void>;
  
  registrarPagamento: (pagamento: Omit<PagamentoDono, "id">) => Promise<void>;
  
  criarPromocao: (promocao: Omit<PromocaoDono, "id">) => Promise<void>;
  atualizarPromocao: (id: string, dados: Partial<PromocaoDono>) => Promise<void>;
  
  responderAvaliacao: (id: string, resposta: string) => Promise<void>;
  
  adicionarProduto: (produto: Omit<ProdutoDono, "id">) => Promise<void>;
  atualizarProduto: (id: string, dados: Partial<ProdutoDono>) => Promise<void>;
  atualizarEstoque: (id: string, quantidade: number) => Promise<void>;
  
  marcarNotificacaoLida: (id: string) => Promise<void>;
  
  atualizarConfiguracao: (dados: Partial<ConfiguracaoBarbearia>) => void;
  
  gerarRelatorio: (dataInicio: string, dataFim: string) => RelatorioDono;
}

const DonoContext = createContext<DonoContextType | undefined>(undefined);

// Dados iniciais (serão substituídos pelos dados reais do banco)
const kpiInicial: KPI = {
  faturamentoHoje: 0,
  faturamentoSemana: 0,
  faturamentoMes: 0,
  agendamentosHoje: 0,
  cancelamentos: 0,
  clientesRecorrentes: 0,
  notaMedia: 0,
  totalAvaliacoes: 0,
  variacaoHoje: 0,
  variacaoSemana: 0,
  variacaoMes: 0,
};

const profissionaisIniciais: ProfissionalDono[] = [
  {
    id: "1",
    nome: "Carlos Barbeiro",
    telefone: "(11) 99999-9999",
    especialidades: ["Corte", "Barba", "Hidratação"],
    comissao: { tipo: "percentual", valor: 40 },
    ativo: true,
    dataAdmissao: "2024-01-15",
    avaliacaoMedia: 4.9,
    totalAvaliacoes: 120,
    faturamentoTotal: 15000.00,
    faltas: 0,
  },
  {
    id: "2",
    nome: "João Silva",
    telefone: "(11) 88888-8888",
    especialidades: ["Corte", "Alisamento"],
    comissao: { tipo: "percentual", valor: 35 },
    ativo: true,
    dataAdmissao: "2024-02-01",
    avaliacaoMedia: 4.7,
    totalAvaliacoes: 85,
    faturamentoTotal: 9800.00,
    faltas: 1,
  },
];

const clientesIniciais: ClienteDono[] = [
  {
    id: "1",
    nome: "Pedro Santos",
    telefone: "(11) 77777-7777",
    vip: true,
    totalAgendamentos: 15,
    ultimoAgendamento: "2024-03-15",
    ticketMedio: 45.00,
    frequencia: 2,
    dataCadastro: "2024-01-10",
  },
  {
    id: "2",
    nome: "Maria Oliveira",
    telefone: "(11) 66666-6666",
    vip: false,
    totalAgendamentos: 8,
    ultimoAgendamento: "2024-03-10",
    ticketMedio: 35.00,
    frequencia: 1,
    dataCadastro: "2024-02-05",
  },
];

const agendamentosIniciais: AgendamentoDono[] = [
  {
    id: "1",
    clienteId: "1",
    clienteNome: "Pedro Santos",
    profissionalId: "1",
    profissionalNome: "Carlos Barbeiro",
    servicoId: "s1",
    servicoNome: "Corte + Barba",
    data: new Date().toISOString().split("T")[0],
    horario: "14:00",
    duracao: 60,
    valor: 45.00,
    status: "confirmado",
    dataCriacao: new Date().toISOString(),
  },
];

const produtosIniciais: ProdutoDono[] = [
  {
    id: "1",
    nome: "Pomada Modeladora Premium",
    categoria: "pomada",
    preco: 25.00,
    estoque: 15,
    estoqueMinimo: 5,
    ativo: true,
  },
  {
    id: "2",
    nome: "Óleo Capilar Hidratante",
    categoria: "oleo",
    preco: 30.00,
    estoque: 8,
    estoqueMinimo: 3,
    ativo: true,
  },
];

const configuracaoInicial: ConfiguracaoBarbearia = {
  id: "1",
  nome: "Barbearia do João",
  cnpjCpf: "12.345.678/0001-90",
  modoConfirmacao: "hibrido",
  horarioFuncionamento: {
    segunda: { aberto: true, inicio: "09:00", fim: "18:00" },
    terca: { aberto: true, inicio: "09:00", fim: "18:00" },
    quarta: { aberto: true, inicio: "09:00", fim: "18:00" },
    quinta: { aberto: true, inicio: "09:00", fim: "18:00" },
    sexta: { aberto: true, inicio: "09:00", fim: "19:00" },
    sabado: { aberto: true, inicio: "08:00", fim: "17:00" },
    domingo: { aberto: false, inicio: "09:00", fim: "13:00" },
  },
  politicaCancelamento: {
    prazoMinimo: 2,
    permitirReagendamento: true,
  },
  linkAgendamento: "https://barberpro.com/agendar/joao",
  paginaPublica: true,
};

export function DonoProvider({ children }: { children: ReactNode }) {
  // Obter barbeariaId do token JWT (prioridade) ou localStorage (fallback)
  const getBarbeariaIdFromStorage = (): string | null => {
    // Primeiro tenta obter do token JWT
    const tokenId = obterBarbeariaIdDoToken();
    if (tokenId) return tokenId;
    
    // Fallback: tenta obter do localStorage
    try {
      const userStr = localStorage.getItem('user');
      const barbeariaStr = localStorage.getItem('barbearia');
      
      if (barbeariaStr) {
        const barbearia = JSON.parse(barbeariaStr);
        return barbearia.id || null;
      }
      
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.barbeariaId || null;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter barbeariaId do localStorage:', error);
      return null;
    }
  };

  const [barbeariaId, setBarbeariaId] = useState<string | null>(getBarbeariaIdFromStorage());
  const [kpi, setKpi] = useState<KPI>(kpiInicial);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDono[]>([]);
  // IMPORTANTE: Sempre inicia vazio - dados vêm APENAS do banco de dados
  const [profissionais, setProfissionais] = useState<ProfissionalDono[]>([]);
  const [clientes, setClientes] = useState<ClienteDono[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoDono[]>([]);
  const [promocoes, setPromocoes] = useState<PromocaoDono[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDono[]>([]);
  const [produtos, setProdutos] = useState<ProdutoDono[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoDono[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoBarbearia>(configuracaoInicial);
  const [loading, setLoading] = useState(true);
  const [ultimoCarregamento, setUltimoCarregamento] = useState<number>(0);

  // Atualizar barbeariaId quando localStorage mudar
  useEffect(() => {
    const checkBarbeariaId = () => {
      const newBarbeariaId = getBarbeariaIdFromStorage();
      if (newBarbeariaId !== barbeariaId) {
        setBarbeariaId(newBarbeariaId);
      }
    };

    // Verificar imediatamente
    checkBarbeariaId();

    // Verificar quando localStorage mudar (evento customizado)
    const handleStorageChange = () => {
      checkBarbeariaId();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Verificar periodicamente (fallback)
    const interval = setInterval(checkBarbeariaId, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [barbeariaId]);

  // Carregar dados da API quando o componente montar ou barbeariaId mudar
  // Mas só se estiver em uma rota do dono (não na página inicial)
  useEffect(() => {
    const currentPath = window.location.pathname;
    const isDonoRoute = currentPath.startsWith('/dono');
    
    if (barbeariaId && isDonoRoute) {
      console.log('🔄 Carregando dados do banco para barbeariaId:', barbeariaId);
      console.log('🔄 Rota atual:', currentPath);
      console.log('🔄 Token disponível:', !!localStorage.getItem('token'));
      // Forçar carregamento imediato ao entrar no painel
      carregarDados(true);
    } else if (isDonoRoute && !barbeariaId) {
      console.warn('⚠️ BarbeariaId não encontrado. Verifique se está logado como dono.');
      console.warn('⚠️ localStorage.user:', localStorage.getItem('user'));
      console.warn('⚠️ localStorage.barbearia:', localStorage.getItem('barbearia'));
      setLoading(false);
    }
  }, [barbeariaId]);

  // Listener para recarregar quando navegar para /dono
  useEffect(() => {
    if (!barbeariaId) return;

    const checkRoute = () => {
      const currentPath = window.location.pathname;
      const isDonoRoute = currentPath.startsWith('/dono');
      
      if (isDonoRoute) {
        console.log('🔄 Detectada navegação para /dono, recarregando dados...');
        // Forçar carregamento ao navegar para o painel
        carregarDados(true);
      }
    };

    // Verificar imediatamente
    checkRoute();

    // Escutar mudanças de rota
    const handlePopState = () => {
      setTimeout(checkRoute, 100);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Verificar periodicamente (fallback para React Router)
    const interval = setInterval(checkRoute, 2000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, [barbeariaId]);

  const carregarDados = async (forcar: boolean = false) => {
    if (!barbeariaId) {
      console.warn('⚠️ [CARREGAR DADOS] Não é possível carregar dados: barbeariaId não definido');
      setLoading(false);
      return;
    }

    // Evitar múltiplas chamadas simultâneas (debounce de 1 segundo)
    // Mas permitir forçar o carregamento (útil após criar/atualizar/deletar)
    const agora = Date.now();
    if (!forcar && agora - ultimoCarregamento < 1000) {
      console.log('⏸️ [CARREGAR DADOS] Carregamento já em andamento, aguardando...');
      // Aguardar um pouco e tentar novamente se estiver forçando
      if (forcar) {
        await new Promise(resolve => setTimeout(resolve, 1100));
        return carregarDados(true);
      }
      return;
    }
    setUltimoCarregamento(agora);

    console.log('📥 [CARREGAR DADOS] ==========================================');
    console.log('📥 [CARREGAR DADOS] Iniciando carregamento de dados do banco de dados...');
    console.log('📥 [CARREGAR DADOS] barbeariaId:', barbeariaId);
    console.log('📥 [CARREGAR DADOS] Token:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
    console.log('📥 [CARREGAR DADOS] Forçar:', forcar);
    setLoading(true);
    try {
      // Carregar dados em paralelo do BANCO DE DADOS
      // IMPORTANTE: Sempre carrega do banco, nunca usa dados mockados
      const [
        kpisData,
        agendamentosData,
        profissionaisData,
        clientesData,
        servicosData,
        pagamentosData,
        promocoesData,
        avaliacoesData,
        produtosData,
        notificacoesData,
        configuracaoData,
      ] = await Promise.all([
        apiGet<KPI>('/dono/dashboard/kpis').catch((err) => {
          console.warn('⚠️ Erro ao carregar KPIs do banco:', err);
          // Retorna valores padrão se houver erro, mas não dados mockados
          return null;
        }),
        apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`).catch((err) => {
          console.warn('⚠️ Erro ao carregar agendamentos do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/profissionais').catch((err) => {
          console.error('❌ Erro ao carregar profissionais do banco:', err);
          // Se erro de autenticação, retorna array vazio (não dados mockados)
          if (err.message?.includes('Token inválido') || err.message?.includes('Token não fornecido')) {
            console.error('❌ Token inválido ou não fornecido. Faça login novamente.');
            return [];
          }
          // Em caso de erro, retorna array vazio (não dados mockados)
          return [];
        }),
        apiGet<any[]>('/dono/clientes').catch((err) => {
          console.warn('⚠️ Erro ao carregar clientes do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/servicos').catch((err) => {
          console.warn('⚠️ Erro ao carregar serviços do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/financeiro/pagamentos').catch((err) => {
          console.warn('⚠️ Erro ao carregar pagamentos do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/promocoes').catch((err) => {
          console.warn('⚠️ Erro ao carregar promoções do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/avaliacoes').catch((err) => {
          console.warn('⚠️ Erro ao carregar avaliações do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/produtos').catch((err) => {
          console.warn('⚠️ Erro ao carregar produtos do banco:', err);
          return [];
        }),
        apiGet<any[]>('/dono/notificacoes').catch((err) => {
          console.warn('⚠️ Erro ao carregar notificações do banco:', err);
          return [];
        }),
        apiGet<any>('/dono/configuracao').catch((err) => {
          console.warn('⚠️ Erro ao carregar configuração do banco:', err);
          return null;
        }),
      ]);

      console.log('✅ Dados carregados do banco:');
      console.log('  - Profissionais:', profissionaisData?.length || 0, profissionaisData);
      console.log('  - Clientes:', clientesData?.length || 0, clientesData);
      console.log('  - Agendamentos:', agendamentosData?.length || 0);
      
      // IMPORTANTE: Se não houver dados, define arrays vazios (NUNCA dados mockados)
      if (!profissionaisData || profissionaisData.length === 0) {
        console.log('ℹ️ Nenhum profissional encontrado no banco de dados');
      }

      // Atualizar KPIs (só se dados vieram do banco)
      if (kpisData) {
        setKpi({
          faturamentoHoje: kpisData.faturamentoHoje || 0,
          faturamentoSemana: kpisData.faturamentoSemana || 0,
          faturamentoMes: kpisData.faturamentoMes || 0,
          agendamentosHoje: kpisData.agendamentosHoje || 0,
          cancelamentos: kpisData.cancelamentos || 0,
          clientesRecorrentes: kpisData.clientesRecorrentes || kpisData.totalClientes || 0,
          notaMedia: kpisData.notaMedia || 0,
          totalAvaliacoes: kpisData.totalAvaliacoes || 0,
          variacaoHoje: kpisData.variacaoHoje || 0,
          variacaoSemana: kpisData.variacaoSemana || 0,
          variacaoMes: kpisData.variacaoMes || 0,
        });
      }

      // Transformar agendamentos da API para o formato do frontend
      const agendamentosTransformados: AgendamentoDono[] = agendamentosData.map((ag: any) => ({
        id: ag.id,
        clienteId: ag.clienteId || '',
        clienteNome: ag.clienteRel?.nome || ag.cliente || 'Cliente não cadastrado',
        clienteTelefone: ag.clienteRel?.telefone || ag.telefone,
        profissionalId: ag.profissionais?.[0]?.profissionalId || '',
        profissionalNome: ag.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
        servicoId: ag.servicoId,
        servicoNome: ag.servico?.nome || '',
        data: ag.data.split('T')[0],
        horario: ag.horario || new Date(ag.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        duracao: ag.servico?.duracao || 40,
        valor: ag.servico?.preco || 0,
        status: ag.status,
        observacoes: ag.observacao,
        dataCriacao: ag.createdAt,
      }));

      setAgendamentos(agendamentosTransformados);

      // Transformar profissionais da API (SEMPRE do banco de dados)
      // Se profissionaisData for null/undefined ou array vazio, define array vazio (não dados mockados)
      const profissionaisTransformados: ProfissionalDono[] = (profissionaisData || []).map((prof: any) => ({
        id: prof.id,
        nome: prof.nome,
        email: prof.email || '',
        telefone: prof.telefone,
        foto: prof.foto,
        especialidades: prof.especialidades || [],
        comissao: {
          tipo: prof.comissaoTipo || 'percentual',
          valor: prof.comissaoValor || 0,
        },
        ativo: prof.ativo !== undefined ? prof.ativo : true,
        dataAdmissao: prof.dataAdmissao 
          ? (typeof prof.dataAdmissao === 'string' 
              ? (prof.dataAdmissao.includes('T') ? prof.dataAdmissao.split('T')[0] : prof.dataAdmissao)
              : new Date(prof.dataAdmissao).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        avaliacaoMedia: 0, // Calcular se necessário
        totalAvaliacoes: 0,
        faturamentoTotal: 0,
        faltas: 0,
      }));

      console.log('✅ Profissionais carregados do banco:', profissionaisTransformados.length);
      setProfissionais(profissionaisTransformados);

      // Transformar clientes da API (SEMPRE do banco de dados)
      // Se clientesData for null/undefined ou array vazio, define array vazio (não dados mockados)
      const clientesTransformados: ClienteDono[] = (clientesData || []).map((cli: any) => ({
        id: cli.id,
        nome: cli.nome,
        email: cli.email || '',
        telefone: cli.telefone || '',
        foto: cli.foto,
        dataNascimento: cli.dataNascimento ? (typeof cli.dataNascimento === 'string' ? cli.dataNascimento.split('T')[0] : new Date(cli.dataNascimento).toISOString().split('T')[0]) : undefined,
        vip: false, // Adicionar campo no backend se necessário
        totalAgendamentos: cli.totalAgendamentos || cli._count?.agendamentos || 0,
        ultimoAgendamento: cli.ultimoAgendamento ? (typeof cli.ultimoAgendamento === 'string' ? cli.ultimoAgendamento : new Date(cli.ultimoAgendamento).toISOString()) : undefined,
        ticketMedio: cli.ticketMedio || 0,
        frequencia: cli.frequencia || 0,
        dataCadastro: cli.createdAt ? (typeof cli.createdAt === 'string' ? cli.createdAt.split('T')[0] : new Date(cli.createdAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      }));

      console.log('✅ [CARREGAR DADOS] Clientes carregados do banco:', clientesTransformados.length);
      console.log('✅ [CARREGAR DADOS] IDs dos clientes:', clientesTransformados.map(c => c.id));
      
      // Preservar clientes temporários que não vieram do banco (evitar que sumam)
      setClientes(prev => {
        const idsDoBanco = new Set(clientesTransformados.map(c => c.id));
        const clientesTemporarios = prev.filter(c => !idsDoBanco.has(c.id));
        
        // Se houver clientes temporários, mantê-los na lista
        if (clientesTemporarios.length > 0) {
          console.log('⚠️ [CARREGAR DADOS] Mantendo clientes temporários:', clientesTemporarios.map(c => c.nome));
          return [...clientesTransformados, ...clientesTemporarios];
        }
        
        return clientesTransformados;
      });

      // Carregar serviços do banco
      console.log('✅ Serviços carregados do banco:', servicosData?.length || 0);
      setServicos(servicosData || []);

      // Transformar pagamentos da API
      const pagamentosTransformados: PagamentoDono[] = (pagamentosData || []).map((pag: any) => ({
        id: pag.id,
        agendamentoId: pag.agendamentoId,
        valor: pag.valor,
        metodo: pag.metodo as 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro',
        status: pag.status as 'pago' | 'pendente' | 'reembolsado',
        taxaGateway: pag.taxaGateway || 0,
        dataPagamento: pag.dataPagamento || undefined,
        dataVencimento: pag.dataVencimento || undefined,
      }));
      console.log('✅ Pagamentos carregados do banco:', pagamentosTransformados.length);
      setPagamentos(pagamentosTransformados);

      // Transformar promoções da API
      const promocoesTransformadas: PromocaoDono[] = (promocoesData || []).map((prom: any) => ({
        id: prom.id,
        nome: prom.nome,
        tipo: prom.tipo as 'desconto_percentual' | 'desconto_fixo' | 'cashback' | 'pontos',
        valor: prom.valor,
        validoDe: prom.validoDe,
        validoAte: prom.validoAte,
        ativo: prom.ativo,
        aplicavelA: prom.aplicavelA as 'todos' | 'servico' | 'horario' | 'cliente_vip',
        servicoId: prom.servicoId || undefined,
        horarioInicio: prom.horarioInicio || undefined,
        horarioFim: prom.horarioFim || undefined,
      }));
      console.log('✅ Promoções carregadas do banco:', promocoesTransformadas.length);
      setPromocoes(promocoesTransformadas);

      // Transformar avaliações da API
      const avaliacoesTransformadas: AvaliacaoDono[] = (avaliacoesData || []).map((av: any) => ({
        id: av.id,
        agendamentoId: av.agendamentoId,
        clienteId: av.clienteId,
        clienteNome: av.cliente?.nome || 'Cliente',
        profissionalId: av.agendamento?.profissionais?.[0]?.profissionalId || '',
        profissionalNome: av.agendamento?.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
        notaProfissional: av.notaProfissional,
        notaAtendimento: av.notaAtendimento,
        notaAmbiente: av.notaAmbiente,
        comentario: av.comentario || undefined,
        resposta: av.resposta || undefined,
        data: av.createdAt,
      }));
      console.log('✅ Avaliações carregadas do banco:', avaliacoesTransformadas.length);
      setAvaliacoes(avaliacoesTransformadas);

      // Transformar produtos da API
      const produtosTransformados: ProdutoDono[] = (produtosData || []).map((prod: any) => ({
        id: prod.id,
        nome: prod.nome,
        descricao: prod.descricao || undefined,
        categoria: prod.categoria as 'pomada' | 'oleo' | 'kit' | 'outro',
        preco: prod.preco,
        estoque: prod.estoque,
        estoqueMinimo: prod.estoqueMinimo,
        ativo: prod.ativo,
        foto: prod.foto || undefined,
      }));
      console.log('✅ Produtos carregados do banco:', produtosTransformados.length);
      setProdutos(produtosTransformados);

      // Transformar notificações da API
      const notificacoesTransformadas: NotificacaoDono[] = (notificacoesData || []).map((not: any) => ({
        id: not.id,
        tipo: not.tipo as 'agendamento' | 'pagamento' | 'avaliacao' | 'estoque' | 'sistema',
        titulo: not.titulo,
        mensagem: not.mensagem,
        lida: not.lida,
        data: not.data || not.createdAt,
        acao: not.urlAcao ? {
          url: not.urlAcao,
          label: not.labelAcao || 'Ver',
        } : undefined,
      }));
      console.log('✅ Notificações carregadas do banco:', notificacoesTransformadas.length);
      setNotificacoes(notificacoesTransformadas);

      // Atualizar configuração da barbearia
      if (configuracaoData) {
        setConfiguracao({
          id: configuracaoData.id || configuracao.id,
          nome: configuracaoData.nome || configuracao.nome,
          cnpjCpf: configuracaoData.cnpjCpf || configuracao.cnpjCpf,
          email: configuracaoData.email || configuracao.email,
          telefone: configuracaoData.telefone || configuracao.telefone,
          endereco: configuracaoData.endereco || configuracao.endereco,
          cidade: configuracaoData.cidade || configuracao.cidade,
          bairro: configuracaoData.bairro || configuracao.bairro,
          cep: configuracaoData.cep || configuracao.cep,
          modoConfirmacao: configuracaoData.modoConfirmacao || configuracao.modoConfirmacao || 'hibrido',
          horarioFuncionamento: configuracao.horarioFuncionamento,
          politicaCancelamento: configuracao.politicaCancelamento,
          linkAgendamento: configuracao.linkAgendamento,
          paginaPublica: configuracao.paginaPublica,
        });
        console.log('✅ Configuração carregada do banco:', configuracaoData);
      }
      
      // Atualizar estado com os dados carregados
      const totalClientes = clientesTransformados.length;
      const totalProfissionais = profissionaisTransformados.length;
      const totalServicos = servicosData?.length || 0;
      const totalAgendamentos = agendamentosTransformados.length;
      
      console.log('✅ [CARREGAR DADOS] ==========================================');
      console.log('✅ [CARREGAR DADOS] Todos os dados foram carregados do banco de dados com sucesso!');
      console.log('✅ [CARREGAR DADOS] Resumo final:');
      console.log(`   - Profissionais: ${totalProfissionais}`);
      console.log(`   - Clientes: ${totalClientes}`);
      console.log(`   - Serviços: ${totalServicos}`);
      console.log(`   - Agendamentos: ${totalAgendamentos}`);
      console.log('✅ [CARREGAR DADOS] ==========================================');
    } catch (error: any) {
      console.error('❌ [CARREGAR DADOS] ==========================================');
      console.error('❌ [CARREGAR DADOS] Erro ao carregar dados do banco:', error);
      console.error('❌ [CARREGAR DADOS] Mensagem:', error?.message);
      console.error('❌ [CARREGAR DADOS] Stack:', error?.stack);
      console.error('❌ [CARREGAR DADOS] ==========================================');
      
      // Não mostrar toast de erro para não incomodar o usuário em caso de erro temporário
      // toast.error('Erro ao carregar dados do painel. Verifique sua conexão.');
      
      // Em caso de erro, define arrays vazios (não dados mockados)
      setProfissionais([]);
      setClientes([]);
      setAgendamentos([]);
    } finally {
      setLoading(false);
      console.log('🔚 [CARREGAR DADOS] Carregamento finalizado. Loading:', false);
    }
  };

  // Funções de agendamento
  const criarAgendamento = async (agendamento: Omit<AgendamentoDono, "id" | "dataCriacao">) => {
    if (!barbeariaId) {
      toast.error('Barbearia não identificada');
      return;
    }

    try {
      // Combinar data e horário
      const dataHora = new Date(`${agendamento.data}T${agendamento.horario}`);
      
      const novoAgendamento = await apiPost<any>('/agendamentos', {
        barbeariaId,
        clienteId: agendamento.clienteId || null,
        servicoId: agendamento.servicoId,
        profissionalId: agendamento.profissionalId || null,
        cliente: agendamento.clienteNome,
        telefone: agendamento.clienteTelefone || '',
        data: dataHora.toISOString(),
        horario: agendamento.horario,
        observacao: agendamento.observacoes || null,
      });

      // Adicionar novo agendamento à lista local (otimização: não recarregar todos os dados)
      if (novoAgendamento.agendamento) {
        const agendamentoTransformado: AgendamentoDono = {
          id: novoAgendamento.agendamento.id,
          clienteId: novoAgendamento.agendamento.clienteId || '',
          clienteNome: novoAgendamento.agendamento.clienteRel?.nome || novoAgendamento.agendamento.cliente || 'Cliente não cadastrado',
          clienteTelefone: novoAgendamento.agendamento.clienteRel?.telefone || novoAgendamento.agendamento.telefone,
          profissionalId: novoAgendamento.agendamento.profissionais?.[0]?.profissionalId || '',
          profissionalNome: novoAgendamento.agendamento.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
          servicoId: novoAgendamento.agendamento.servicoId,
          servicoNome: novoAgendamento.agendamento.servico?.nome || '',
          data: novoAgendamento.agendamento.data.split('T')[0],
          horario: novoAgendamento.agendamento.horario || new Date(novoAgendamento.agendamento.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          duracao: novoAgendamento.agendamento.servico?.duracao || 40,
          valor: novoAgendamento.agendamento.servico?.preco || 0,
          status: novoAgendamento.agendamento.status,
          observacoes: novoAgendamento.agendamento.observacao,
          dataCriacao: novoAgendamento.agendamento.createdAt,
        };
        
        setAgendamentos(prev => [...prev, agendamentoTransformado]);
      } else {
        // Fallback: recarregar apenas agendamentos se formato não for o esperado
        const agendamentosData = await apiGet<any[]>(`/agendamentos/barbearia/${barbeariaId}`).catch(() => []);
        const agendamentosTransformados: AgendamentoDono[] = agendamentosData.map((ag: any) => ({
          id: ag.id,
          clienteId: ag.clienteId || '',
          clienteNome: ag.clienteRel?.nome || ag.cliente || 'Cliente não cadastrado',
          clienteTelefone: ag.clienteRel?.telefone || ag.telefone,
          profissionalId: ag.profissionais?.[0]?.profissionalId || '',
          profissionalNome: ag.profissionais?.[0]?.profissional?.nome || 'Não atribuído',
          servicoId: ag.servicoId,
          servicoNome: ag.servico?.nome || '',
          data: ag.data.split('T')[0],
          horario: ag.horario || new Date(ag.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          duracao: ag.servico?.duracao || 40,
          valor: ag.servico?.preco || 0,
          status: ag.status,
          observacoes: ag.observacao,
          dataCriacao: ag.createdAt,
        }));
        setAgendamentos(agendamentosTransformados);
      }
      
      toast.success('Agendamento criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao criar agendamento');
      throw error;
    }
  };

  const atualizarAgendamento = async (id: string, dados: Partial<AgendamentoDono>) => {
    try {
      // Se precisar atualizar via API, adicionar endpoint
      setAgendamentos(agendamentos.map((a) => (a.id === id ? { ...a, ...dados } : a)));
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    }
  };

  const cancelarAgendamento = async (id: string) => {
    try {
      await apiPut(`/agendamentos/${id}/cancelar`, {});
      await carregarDados();
      toast.success('Agendamento cancelado');
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error(error.message || 'Erro ao cancelar agendamento');
    }
  };

  const confirmarAgendamento = async (id: string) => {
    try {
      await apiPut(`/agendamentos/${id}/confirmar`, {});
      await carregarDados();
      toast.success('Agendamento confirmado!');
    } catch (error: any) {
      console.error('Erro ao confirmar agendamento:', error);
      toast.error(error.message || 'Erro ao confirmar agendamento');
      throw error;
    }
  };

  const recusarAgendamento = async (id: string, motivo?: string) => {
    try {
      await apiPut(`/agendamentos/${id}/recusar`, { motivo });
      await carregarDados();
      toast.success('Agendamento recusado');
    } catch (error: any) {
      console.error('Erro ao recusar agendamento:', error);
      toast.error(error.message || 'Erro ao recusar agendamento');
      throw error;
    }
  };

  // Funções de profissional
  const adicionarProfissional = async (profissional: Omit<ProfissionalDono, "id" | "dataAdmissao" | "avaliacaoMedia" | "totalAvaliacoes" | "faturamentoTotal" | "faltas">) => {
    try {
      console.log('➕ Adicionando profissional ao banco de dados:', profissional.nome);
      const resultado = await apiPost('/dono/profissionais', {
        nome: profissional.nome,
        email: profissional.email,
        telefone: profissional.telefone,
        foto: profissional.foto,
        especialidades: profissional.especialidades,
        comissaoTipo: profissional.comissao.tipo,
        comissaoValor: profissional.comissao.valor,
      });
      
      console.log('✅ Profissional adicionado ao banco:', resultado);
      
      // SEMPRE recarregar dados do banco após adicionar
      console.log('🔄 Recarregando dados do banco após adicionar profissional...');
      await carregarDados(true);
      
      console.log('✅ Dados recarregados do banco com sucesso');
      toast.success('Profissional adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar profissional:', error);
      toast.error(error.message || 'Erro ao adicionar profissional');
      throw error;
    }
  };

  const atualizarProfissional = async (id: string, dados: Partial<ProfissionalDono>) => {
    try {
      console.log('✏️ Atualizando profissional no banco:', id);
      const updateData: any = {};
      if (dados.nome) updateData.nome = dados.nome;
      if (dados.email !== undefined) updateData.email = dados.email;
      if (dados.telefone) updateData.telefone = dados.telefone;
      if (dados.foto !== undefined) updateData.foto = dados.foto;
      if (dados.especialidades) updateData.especialidades = dados.especialidades;
      if (dados.comissao) {
        updateData.comissaoTipo = dados.comissao.tipo;
        updateData.comissaoValor = dados.comissao.valor;
      }
      if (dados.ativo !== undefined) updateData.ativo = dados.ativo;

      await apiPut(`/dono/profissionais/${id}`, updateData);
      console.log('✅ Profissional atualizado no banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Profissional atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar profissional:', error);
      toast.error(error.message || 'Erro ao atualizar profissional');
    }
  };

  const removerProfissional = async (id: string) => {
    try {
      console.log('🗑️ Removendo profissional do banco:', id);
      await apiDelete(`/dono/profissionais/${id}`);
      console.log('✅ Profissional removido do banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Profissional removido');
    } catch (error: any) {
      console.error('❌ Erro ao remover profissional:', error);
      toast.error(error.message || 'Erro ao remover profissional');
    }
  };

  // Funções de cliente
  const adicionarCliente = async (cliente: Omit<ClienteDono, "id" | "dataCadastro" | "totalAgendamentos" | "ticketMedio" | "frequencia">) => {
    try {
      console.log('➕ [ADICIONAR CLIENTE] Iniciando...');
      console.log('➕ [ADICIONAR CLIENTE] Dados:', cliente);
      console.log('➕ [ADICIONAR CLIENTE] Token:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('➕ [ADICIONAR CLIENTE] BarbeariaId:', barbeariaId);
      
      const resultado = await apiPost<any>('/dono/clientes', {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        foto: cliente.foto,
        dataNascimento: cliente.dataNascimento,
      });
      
      console.log('✅ [ADICIONAR CLIENTE] Cliente adicionado ao banco:', resultado);
      
      // Adicionar cliente temporariamente à lista enquanto recarrega
      if (resultado && resultado.id) {
        const novoCliente: ClienteDono = {
          id: resultado.id,
          nome: resultado.nome || cliente.nome,
          email: resultado.email || cliente.email || '',
          telefone: resultado.telefone || cliente.telefone || '',
          foto: resultado.foto || cliente.foto,
          dataNascimento: resultado.dataNascimento ? (typeof resultado.dataNascimento === 'string' ? resultado.dataNascimento.split('T')[0] : new Date(resultado.dataNascimento).toISOString().split('T')[0]) : cliente.dataNascimento,
          vip: false,
          totalAgendamentos: 0,
          ticketMedio: 0,
          frequencia: 0,
          dataCadastro: resultado.createdAt ? (typeof resultado.createdAt === 'string' ? resultado.createdAt.split('T')[0] : new Date(resultado.createdAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        };
        
        // Adicionar à lista imediatamente
        setClientes(prev => {
          // Verificar se já não existe (evitar duplicatas)
          const existe = prev.find(c => c.id === novoCliente.id);
          if (existe) return prev;
          return [...prev, novoCliente];
        });
        
        console.log('✅ [ADICIONAR CLIENTE] Cliente adicionado temporariamente à lista');
      }
      
      console.log('🔄 [ADICIONAR CLIENTE] Iniciando recarregamento forçado de dados...');
      
      // Guardar ID do cliente criado para verificar depois
      const clienteIdCriado = resultado?.id;
      
      // Forçar recarregamento após delay maior para garantir que o banco commitou
      setTimeout(async () => {
        try {
          await carregarDados(true);
          console.log('✅ [ADICIONAR CLIENTE] Dados recarregados');
        } catch (error) {
          console.error('❌ [ADICIONAR CLIENTE] Erro ao recarregar dados:', error);
          // Em caso de erro, manter o cliente temporário na lista
        }
      }, 1500); // Aumentar delay para 1.5 segundos para dar tempo ao banco
      
      toast.success('Cliente adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ [ADICIONAR CLIENTE] Erro completo:', error);
      console.error('❌ [ADICIONAR CLIENTE] Mensagem:', error.message);
      console.error('❌ [ADICIONAR CLIENTE] Stack:', error.stack);
      toast.error(error.message || 'Erro ao adicionar cliente');
      throw error;
    }
  };

  const atualizarCliente = async (id: string, dados: Partial<ClienteDono>) => {
    try {
      const updateData: any = {};
      if (dados.nome) updateData.nome = dados.nome;
      if (dados.email) updateData.email = dados.email;
      if (dados.telefone) updateData.telefone = dados.telefone;
      if (dados.foto !== undefined) updateData.foto = dados.foto;
      if (dados.dataNascimento) updateData.dataNascimento = dados.dataNascimento;
      // ativo não está no tipo ClienteDono, mas pode ser usado no backend
      if ((dados as any).ativo !== undefined) updateData.ativo = (dados as any).ativo;

      await apiPut(`/dono/clientes/${id}`, updateData);
      await carregarDados(true);
      toast.success('Cliente atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(error.message || 'Erro ao atualizar cliente');
    }
  };

  const marcarClienteVIP = async (id: string, vip: boolean) => {
    // Implementar quando o backend tiver suporte a VIP
    toast.info('Funcionalidade VIP em desenvolvimento');
  };

  // Funções de serviços
  const adicionarServico = async (servico: { nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }) => {
    try {
      console.log('➕ Adicionando serviço ao banco de dados:', servico.nome);
      await apiPost('/dono/servicos', servico);
      console.log('✅ Serviço adicionado ao banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Serviço adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar serviço:', error);
      toast.error(error.message || 'Erro ao adicionar serviço');
      throw error;
    }
  };

  const atualizarServico = async (id: string, dados: Partial<{ nome: string; descricao?: string; preco: number; duracao: number; tipo?: string; ordem?: number; ativo?: boolean }>) => {
    try {
      console.log('✏️ Atualizando serviço no banco:', id);
      await apiPut(`/dono/servicos/${id}`, dados);
      console.log('✅ Serviço atualizado no banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Serviço atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar serviço:', error);
      toast.error(error.message || 'Erro ao atualizar serviço');
    }
  };

  const removerServico = async (id: string) => {
    try {
      console.log('🗑️ Removendo serviço do banco:', id);
      await apiDelete(`/dono/servicos/${id}`);
      console.log('✅ Serviço removido do banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Serviço removido');
    } catch (error: any) {
      console.error('❌ Erro ao remover serviço:', error);
      toast.error(error.message || 'Erro ao remover serviço');
    }
  };

  const toggleServicoAtivo = async (id: string) => {
    try {
      console.log('🔄 Alternando status do serviço:', id);
      await apiPut(`/dono/servicos/${id}/toggle`, {});
      console.log('✅ Status do serviço alterado, recarregando dados...');
      await carregarDados(true);
      toast.success('Status do serviço alterado');
    } catch (error: any) {
      console.error('❌ Erro ao alterar status do serviço:', error);
      toast.error(error.message || 'Erro ao alterar status do serviço');
    }
  };

  // Funções de pagamento
  const registrarPagamento = async (pagamento: Omit<PagamentoDono, "id">): Promise<void> => {
    // Pagamentos são criados automaticamente quando um agendamento é confirmado/concluído
    // Esta função pode ser usada para criar pagamentos manuais se necessário
    console.log('💰 Registrando pagamento:', pagamento);
    // Recarregar dados para obter o pagamento criado
    await carregarDados(true);
  };

  // Funções de promoção
  const criarPromocao = async (promocao: Omit<PromocaoDono, "id">) => {
    try {
      console.log('🎁 Criando promoção no banco de dados:', promocao.nome);
      await apiPost('/dono/promocoes', {
        nome: promocao.nome,
        tipo: promocao.tipo,
        valor: promocao.valor,
        validoDe: promocao.validoDe,
        validoAte: promocao.validoAte,
        ativo: promocao.ativo,
        aplicavelA: promocao.aplicavelA,
        servicoId: promocao.servicoId,
        horarioInicio: promocao.horarioInicio,
        horarioFim: promocao.horarioFim,
      });
      console.log('✅ Promoção criada no banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Promoção criada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao criar promoção:', error);
      toast.error(error.message || 'Erro ao criar promoção');
      throw error;
    }
  };

  const atualizarPromocao = async (id: string, dados: Partial<PromocaoDono>) => {
    try {
      console.log('✏️ Atualizando promoção no banco:', id);
      await apiPut(`/dono/promocoes/${id}`, dados);
      console.log('✅ Promoção atualizada no banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Promoção atualizada!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar promoção:', error);
      toast.error(error.message || 'Erro ao atualizar promoção');
    }
  };

  // Funções de avaliação
  const responderAvaliacao = async (id: string, resposta: string) => {
    try {
      console.log('⭐ Respondendo avaliação no banco:', id);
      await apiPut(`/dono/avaliacoes/${id}/responder`, { resposta });
      console.log('✅ Avaliação respondida no banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Avaliação respondida!');
    } catch (error: any) {
      console.error('❌ Erro ao responder avaliação:', error);
      toast.error(error.message || 'Erro ao responder avaliação');
    }
  };

  // Funções de produto
  const adicionarProduto = async (produto: Omit<ProdutoDono, "id">) => {
    try {
      console.log('📦 Adicionando produto ao banco de dados:', produto.nome);
      await apiPost('/dono/produtos', {
        nome: produto.nome,
        descricao: produto.descricao,
        categoria: produto.categoria,
        preco: produto.preco,
        estoque: produto.estoque,
        estoqueMinimo: produto.estoqueMinimo,
        ativo: produto.ativo,
        foto: produto.foto,
      });
      console.log('✅ Produto adicionado ao banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Produto adicionado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar produto:', error);
      toast.error(error.message || 'Erro ao adicionar produto');
      throw error;
    }
  };

  const atualizarProduto = async (id: string, dados: Partial<ProdutoDono>) => {
    try {
      console.log('✏️ Atualizando produto no banco:', id);
      await apiPut(`/dono/produtos/${id}`, dados);
      console.log('✅ Produto atualizado no banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Produto atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar produto:', error);
      toast.error(error.message || 'Erro ao atualizar produto');
    }
  };

  const atualizarEstoque = async (id: string, quantidade: number) => {
    try {
      console.log('📊 Atualizando estoque no banco:', id, quantidade);
      await apiPut(`/dono/produtos/${id}/estoque`, { quantidade });
      console.log('✅ Estoque atualizado no banco, recarregando dados...');
      await carregarDados(true);
      toast.success('Estoque atualizado!');
    } catch (error: any) {
      console.error('❌ Erro ao atualizar estoque:', error);
      toast.error(error.message || 'Erro ao atualizar estoque');
    }
  };

  // Funções de notificação
  const marcarNotificacaoLida = async (id: string) => {
    try {
      console.log('🔔 Marcando notificação como lida no banco:', id);
      await apiPut(`/dono/notificacoes/${id}/lida`, {});
      console.log('✅ Notificação marcada como lida, recarregando dados...');
      await carregarDados(true);
    } catch (error: any) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      toast.error(error.message || 'Erro ao marcar notificação como lida');
    }
  };

  // Funções de configuração
  const atualizarConfiguracao = (dados: Partial<ConfiguracaoBarbearia>) => {
    setConfiguracao({ ...configuracao, ...dados });
  };

  // Funções de relatório
  const gerarRelatorio = (dataInicio: string, dataFim: string): RelatorioDono => {
    const agendamentosPeriodo = agendamentos.filter(
      (a) => a.data >= dataInicio && a.data <= dataFim
    );

    const faturamento = agendamentosPeriodo.reduce((sum, a) => sum + a.valor, 0);
    const cancelamentos = agendamentosPeriodo.filter((a) => a.status === "cancelado").length;

    return {
      periodo: `${dataInicio} a ${dataFim}`,
      faturamento,
      agendamentos: agendamentosPeriodo.length,
      cancelamentos,
      taxaCancelamento: agendamentosPeriodo.length > 0 ? (cancelamentos / agendamentosPeriodo.length) * 100 : 0,
      ticketMedio: agendamentosPeriodo.length > 0 ? faturamento / agendamentosPeriodo.length : 0,
      servicosMaisVendidos: [],
      profissionaisMaisRentaveis: [],
      horariosPico: [],
    };
  };

  return (
    <DonoContext.Provider
      value={{
        kpi,
        agendamentos,
        profissionais,
        clientes,
        servicos,
        pagamentos,
        promocoes,
        avaliacoes,
        produtos,
        notificacoes,
        configuracao,
        criarAgendamento,
        atualizarAgendamento,
        cancelarAgendamento,
        confirmarAgendamento,
        recusarAgendamento,
        adicionarProfissional,
        atualizarProfissional,
        removerProfissional,
        adicionarCliente,
        atualizarCliente,
        marcarClienteVIP,
        adicionarServico,
        atualizarServico,
        removerServico,
        toggleServicoAtivo,
        registrarPagamento,
        criarPromocao,
        atualizarPromocao,
        responderAvaliacao,
        adicionarProduto,
        atualizarProduto,
        atualizarEstoque,
        marcarNotificacaoLida,
        atualizarConfiguracao,
        gerarRelatorio,
      }}
    >
      {children}
    </DonoContext.Provider>
  );
}

export function useDono() {
  const context = useContext(DonoContext);
  if (!context) {
    throw new Error("useDono deve ser usado dentro de DonoProvider");
  }
  return context;
}







