// API service para o painel do dono
const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app';

export interface ClienteDonoRequest {
  nome: string;
  telefone: string;
  email?: string;
}

export interface ClienteDonoResponse {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  vip: boolean;
  totalAgendamentos: number;
  ultimoAgendamento: string | null;
  ticketMedio: number;
  frequencia: number;
  dataCadastro: string;
}

/**
 * Listar clientes de uma barbearia
 */
export async function listarClientes(barbeariaId: string): Promise<ClienteDonoResponse[]> {
  const response = await fetch(`${API_URL}/api/dono/${barbeariaId}/clientes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao listar clientes');
  }

  const data = await response.json();
  return data.clientes || [];
}

/**
 * Criar cliente
 */
export async function criarCliente(
  barbeariaId: string,
  cliente: ClienteDonoRequest
): Promise<ClienteDonoResponse> {
  const response = await fetch(`${API_URL}/api/dono/${barbeariaId}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar cliente');
  }

  const data = await response.json();
  return data.cliente;
}

/**
 * Marcar cliente como VIP
 */
export async function marcarClienteVIP(
  barbeariaId: string,
  clienteId: string,
  vip: boolean
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/dono/${barbeariaId}/clientes/${clienteId}/vip`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vip }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao marcar cliente VIP');
  }
}

