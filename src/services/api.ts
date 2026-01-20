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
  const urlCompleta = `${API_URL}${endpoint}`;
  
  // Log detalhado para requisições DELETE (debug)
  if (options.method === 'DELETE') {
    console.log('🌐 [API REQUEST] DELETE:', urlCompleta);
    console.log('🌐 [API REQUEST] Method:', options.method);
    console.log('🌐 [API REQUEST] Token presente:', !!token);
  }
  
  const response = await fetch(urlCompleta, {
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
    
    // Log detalhado de erros
    console.error('❌ [API REQUEST] Erro na requisição:');
    console.error('   URL:', urlCompleta);
    console.error('   Status:', response.status);
    console.error('   Status Text:', response.statusText);
    console.error('   Error:', error);
    
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
    
    // Para erros 404, incluir mais informações
    if (response.status === 404) {
      const mensagemErro = error.error || error.message || 'Rota não encontrada';
      const erroCompleto = new Error(mensagemErro);
      (erroCompleto as any).status = 404;
      (erroCompleto as any).url = urlCompleta;
      throw erroCompleto;
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
