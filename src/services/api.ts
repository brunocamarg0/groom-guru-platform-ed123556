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
  
  // Log detalhado para requisições PUT (especialmente para configuracao)
  if (options.method === 'PUT' && endpoint.includes('configuracao')) {
    console.log('💾 [API REQUEST] PUT Configuração:', urlCompleta);
    console.log('💾 [API REQUEST] Token presente:', !!token);
    console.log('💾 [API REQUEST] Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');
    console.log('💾 [API REQUEST] Token (últimos 20 chars):', token ? '...' + token.substring(token.length - 20) : 'N/A');
    console.log('💾 [API REQUEST] Body size:', options.body ? (options.body as string).length : 0);
    
    // Verificar se o token parece válido (deve ter 3 partes separadas por ponto)
    if (token) {
      const tokenParts = token.split('.');
      console.log('💾 [API REQUEST] Token parts:', tokenParts.length);
      if (tokenParts.length !== 3) {
        console.error('❌ [API REQUEST] Token parece estar em formato inválido!');
      }
    }
  }
  
  // Verificar se há token antes de fazer requisição
  if (!token && endpoint.includes('/dono/')) {
    console.error('❌ [API REQUEST] Requisição para rota protegida sem token!');
    throw new Error('Token não encontrado. Faça login novamente.');
  }
  
  // Para requisições PUT com foto, adicionar timeout maior e logs detalhados
  const isPhotoUpload = options.method === 'PUT' && endpoint.includes('configuracao');
  const timeout = isPhotoUpload ? 60000 : 30000; // 60s para upload de foto, 30s para outras
  
  console.log('🌐 [API REQUEST] Iniciando requisição:', {
    method: options.method,
    endpoint,
    urlCompleta,
    isPhotoUpload,
    timeout: `${timeout / 1000}s`,
    bodySize: options.body ? (options.body as string).length : 0
  });
  
  // Criar AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('❌ [API REQUEST] Timeout na requisição após', timeout, 'ms');
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(urlCompleta, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ [API REQUEST] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
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
      
      // Se erro de autenticação, criar erro descritivo
      if (response.status === 401) {
        const currentPath = window.location.pathname;
        const tokenAtual = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        
        console.error('❌ [API REQUEST] Erro 401 - Token inválido');
        console.error('   Path:', currentPath);
        console.error('   Endpoint:', endpoint);
        console.error('   Method:', options.method);
        console.error('   Token presente:', !!tokenAtual);
        console.error('   Token (primeiros 20 chars):', tokenAtual ? tokenAtual.substring(0, 20) + '...' : 'N/A');
        console.error('   UserType:', userType);
        console.error('   Error message:', error.error || error.message);
        
        // Criar erro mais descritivo e lançar
        const erroCompleto = new Error(error.error || error.message || 'Token inválido');
        (erroCompleto as any).status = 401;
        (erroCompleto as any).endpoint = endpoint;
        throw erroCompleto;
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
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Se for erro de abort (timeout), criar mensagem específica
    if (error.name === 'AbortError') {
      console.error('❌ [API REQUEST] Requisição abortada (timeout)');
      throw new Error(`Requisição demorou mais de ${timeout / 1000} segundos. Tente novamente com uma imagem menor.`);
    }
    
    // Re-lançar outros erros
    throw error;
  }
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
