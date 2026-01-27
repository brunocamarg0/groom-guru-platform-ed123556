import { apiRequest, apiGet, apiPost, apiPut, apiDelete } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';

/**
 * Serviço de API para o painel administrativo
 */

// Tipos para barbearias do backend
export interface BarbeariaBackend {
  id: string;
  nome: string;
  cnpjCpf: string;
  responsavel: string;
  plano: string;
  status: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  foto?: string;
  dataVencimento: string;
  createdAt: string;
  updatedAt: string;
  dono?: {
    id: string;
    nome: string;
    email: string;
    ativo: boolean;
  } | null;
  convites?: {
    id: string;
    token: string;
    expiraEm: string;
  }[];
  _count?: {
    servicos: number;
    agendamentos: number;
  };
  servicos?: ServicoBackend[];
}

export interface ServicoBackend {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracao: number;
  tipo?: string;
  ativo: boolean;
  ordem: number;
}

export interface DashboardStats {
  totalBarbearias: number;
  barbeariasAtivas: number;
  barbeariasEmTeste: number;
  barbeariasBloquedas: number;
  barbeariasCanceladas: number;
  totalUsuarios: number;
  totalAgendamentos: number;
  faturamentoMensal: number;
}

// ===== BARBEARIAS =====

export async function listarBarbeariasAdmin(): Promise<BarbeariaBackend[]> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao listar barbearias' }));
    throw new Error(error.error || 'Erro ao listar barbearias');
  }

  return response.json();
}

export async function buscarBarbeariaAdmin(id: string): Promise<BarbeariaBackend> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao buscar barbearia' }));
    throw new Error(error.error || 'Erro ao buscar barbearia');
  }

  return response.json();
}

export interface CriarBarbeariaPayload {
  nome: string;
  cnpjCpf: string;
  responsavel: string;
  plano: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  enviarEmail?: boolean;
}

export async function criarBarbeariaAdmin(dados: CriarBarbeariaPayload): Promise<BarbeariaBackend> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao criar barbearia' }));
    throw new Error(error.error || 'Erro ao criar barbearia');
  }

  return response.json();
}

export async function atualizarBarbeariaAdmin(id: string, dados: Partial<CriarBarbeariaPayload>): Promise<BarbeariaBackend> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao atualizar barbearia' }));
    throw new Error(error.error || 'Erro ao atualizar barbearia');
  }

  return response.json();
}

export async function alterarStatusBarbeariaAdmin(id: string, status: string): Promise<BarbeariaBackend> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao alterar status' }));
    throw new Error(error.error || 'Erro ao alterar status');
  }

  return response.json();
}

export async function deletarBarbeariaAdmin(id: string): Promise<void> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao deletar barbearia' }));
    throw new Error(error.error || 'Erro ao deletar barbearia');
  }
}

// ===== USUÁRIOS DONO =====

export interface UsuarioDonoBackend {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  emailVerificado?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function buscarUsuarioDono(barbeariaId: string): Promise<UsuarioDonoBackend> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias/${barbeariaId}/dono`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao buscar usuário dono' }));
    throw new Error(error.error || 'Erro ao buscar usuário dono');
  }

  return response.json();
}

export interface CriarUsuarioDonoPayload {
  barbeariaId: string;
  nome: string;
  email: string;
  senha: string;
}

export async function criarUsuarioDono(dados: CriarUsuarioDonoPayload): Promise<UsuarioDonoBackend> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/admin/barbearias/${dados.barbeariaId}/dono`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao criar usuário dono' }));
    throw new Error(error.error || 'Erro ao criar usuário dono');
  }

  return response.json();
}

// ===== SOLICITAÇÕES =====

export interface SolicitacaoCadastro {
  id: string;
  nome: string;
  cnpjCpf: string;
  responsavel: string;
  email: string;
  telefone?: string;
  endereco?: string;
  plano: string;
  status: string;
  observacoes?: string;
  createdAt: string;
}

export async function listarSolicitacoes(status?: string): Promise<SolicitacaoCadastro[]> {
  const token = localStorage.getItem('token');
  const url = status 
    ? `${API_URL}/solicitacoes/admin?status=${status}`
    : `${API_URL}/solicitacoes/admin`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao listar solicitações' }));
    throw new Error(error.error || 'Erro ao listar solicitações');
  }

  return response.json();
}

export async function aprovarSolicitacao(id: string, observacoes?: string): Promise<any> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/solicitacoes/admin/${id}/aprovar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ observacoes }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao aprovar solicitação' }));
    throw new Error(error.error || 'Erro ao aprovar solicitação');
  }

  return response.json();
}

export async function rejeitarSolicitacao(id: string, observacoes?: string): Promise<any> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/solicitacoes/admin/${id}/rejeitar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ observacoes }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro ao rejeitar solicitação' }));
    throw new Error(error.error || 'Erro ao rejeitar solicitação');
  }

  return response.json();
}

// ===== DASHBOARD STATS =====

export async function getDashboardStats(): Promise<DashboardStats> {
  // Por enquanto, calcular a partir das barbearias
  const barbearias = await listarBarbeariasAdmin();
  
  return {
    totalBarbearias: barbearias.length,
    barbeariasAtivas: barbearias.filter(b => b.status === 'ativa').length,
    barbeariasEmTeste: barbearias.filter(b => b.status === 'em_teste').length,
    barbeariasBloquedas: barbearias.filter(b => b.status === 'bloqueada').length,
    barbeariasCanceladas: barbearias.filter(b => b.status === 'cancelada').length,
    totalUsuarios: barbearias.filter(b => b.dono).length,
    totalAgendamentos: barbearias.reduce((sum, b) => sum + (b._count?.agendamentos || 0), 0),
    faturamentoMensal: 0, // Implementar depois
  };
}
