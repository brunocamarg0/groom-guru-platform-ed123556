const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';

export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Função genérica para fazer requisições à API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'Erro na requisição',
    }));
    
    // Se erro de autenticação, limpar token e redirecionar para login
    // Mas só redirecionar se estiver em uma rota protegida (não na página inicial)
    if (response.status === 401) {
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/' || currentPath === '/login' || currentPath === '/cadastro' || currentPath.startsWith('/funcionalidades');
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('barbearia');
      
      // Só redirecionar se não estiver em rota pública e não estiver já na página de login
      if (!isPublicRoute && !currentPath.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    throw new Error(error.error || error.message || 'Erro na requisição');
  }

  return response.json();
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}
