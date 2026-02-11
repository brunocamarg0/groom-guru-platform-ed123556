import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';

const Login = () => {
  // Log quando o componente é montado
  useEffect(() => {
    console.log('🔐 [LOGIN COMPONENT] Componente Login montado');
    console.log('   API_URL:', API_URL);
    
    // Listener para erros JavaScript
    const errorHandler = (event: ErrorEvent) => {
      console.error('❌ [LOGIN COMPONENT] Erro JavaScript capturado:', event.error);
      console.error('   Mensagem:', event.message);
      console.error('   Arquivo:', event.filename);
      console.error('   Linha:', event.lineno);
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Obter tab da URL ou usar 'owner' como padrão
  const tabFromUrl = searchParams.get('tab');
  const getInitialTab = () => {
    if (tabFromUrl === 'client') return 'client';
    return 'owner';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Estados para formulários
  const [formData, setFormData] = useState({
    owner: { email: "", senha: "" },
    client: { email: "", senha: "" },
  });

  // Listener para detectar quando o localStorage é modificado (debug)
  // REMOVIDO: A sobrescrita de Storage.prototype pode causar problemas
  // Em vez disso, vamos usar eventos customizados
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userType') {
        console.log(`🔍 [LOCALSTORAGE DEBUG] StorageEvent detectado: ${e.key}`, {
          oldValue: e.oldValue ? (e.key === 'token' ? e.oldValue.substring(0, 30) + '...' : e.oldValue) : null,
          newValue: e.newValue ? (e.key === 'token' ? e.newValue.substring(0, 30) + '...' : e.newValue) : null,
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CAPTURAR activeTab e redirectPath NO INÍCIO para garantir que não mudem
    const currentTab = activeTab;
    let endpoint = '';
    let redirectPath = '';
    let expectedUserType = '';

    if (currentTab === 'owner') {
      endpoint = '/auth/dono/login';
      redirectPath = '/dono';
      expectedUserType = 'dono';
    } else if (currentTab === 'client') {
      endpoint = '/auth/cliente/login';
      redirectPath = '/cliente';
      expectedUserType = 'cliente';
    }
    
    console.log('🔐 [LOGIN] ========== INÍCIO DO PROCESSO DE LOGIN ==========');
    console.log('🔐 [LOGIN] ActiveTab (capturado):', currentTab);
    console.log('🔐 [LOGIN] Endpoint:', endpoint);
    console.log('🔐 [LOGIN] RedirectPath (capturado):', redirectPath);
    console.log('🔐 [LOGIN] ExpectedUserType:', expectedUserType);
    console.log('🔐 [LOGIN] FormData:', { email: formData[currentTab as keyof typeof formData].email, senha: '***' });
    setIsLoading(true);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 [LOGIN] ========== INICIANDO LOGIN ==========');
    console.log('   Tab ativo:', currentTab);
    console.log('   Email:', formData[currentTab as keyof typeof formData].email);
    console.log('   Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');

    try {

      console.log('🔐 [LOGIN] Fazendo requisição para:', `${API_URL}${endpoint}`);
      console.log('🔐 [LOGIN] Dados enviados:', { email: formData[activeTab as keyof typeof formData].email, senha: '***' });
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData[currentTab as keyof typeof formData]),
      });

      console.log('🔐 [LOGIN] Resposta recebida:', { status: response.status, ok: response.ok });

      let data;
      try {
        const responseText = await response.text();
        console.log('🔐 [LOGIN] Resposta como texto (primeiros 200 chars):', responseText.substring(0, 200));
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [LOGIN] Erro ao parsear resposta JSON:', parseError);
        throw new Error('Resposta inválida do servidor');
      }

      console.log('🔐 [LOGIN] Resposta da API (dados parseados):', {
        ok: response.ok,
        status: response.status,
        hasToken: !!data.token,
        tokenLength: data.token ? data.token.length : 0,
        hasUsuario: !!data.usuario,
        hasBarbearia: !!data.barbearia,
        sucesso: data.sucesso,
        dataKeys: Object.keys(data),
        data: data, // Log completo para debug
      });

      if (!response.ok) {
        console.error('❌ [LOGIN] Erro na resposta:', data);
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Verificar se o token está presente na resposta
      if (!data.token) {
        console.error('❌ [LOGIN] Token não encontrado na resposta da API!');
        console.error('   Resposta completa:', JSON.stringify(data, null, 2));
        throw new Error('Token não recebido do servidor. Tente novamente.');
      }

      // Salvar token e dados do usuário (usando a mesma lógica simples do cadastro)
      if (data.token) {
        console.log('🔐 [LOGIN] Salvando token no localStorage...');
        console.log('🔐 [LOGIN] Usando currentTab (capturado):', currentTab);
        console.log('🔐 [LOGIN] ExpectedUserType:', expectedUserType);
        const userType = expectedUserType; // Usar o userType capturado no início
        
        // Salvar em localStorage (mesma lógica do cadastro)
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', userType);
        
        if (data.usuario) {
          localStorage.setItem('user', JSON.stringify(data.usuario));
        }

        if (data.barbearia) {
          localStorage.setItem('barbearia', JSON.stringify(data.barbearia));
        }

        // Verificar se foi salvo corretamente
        const tokenSalvo = localStorage.getItem('token');
        const userTypeSalvo = localStorage.getItem('userType');
        
        console.log('🔐 [LOGIN] Dados salvos - Verificação:');
        console.log('   Token salvo:', !!tokenSalvo);
        console.log('   Token (primeiros 30 chars):', tokenSalvo ? tokenSalvo.substring(0, 30) + '...' : 'null');
        console.log('   UserType salvo:', userTypeSalvo);
        console.log('   UserType esperado:', userType);
        console.log('   RedirectPath:', redirectPath);

        if (!tokenSalvo || userTypeSalvo !== userType) {
          console.error('❌ [LOGIN] Erro ao salvar token! Tentando novamente...');
          // Tentar salvar novamente
          localStorage.setItem('token', data.token);
          localStorage.setItem('userType', userType);
          if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
          if (data.barbearia) localStorage.setItem('barbearia', JSON.stringify(data.barbearia));
          
          // Verificar novamente
          const tokenVerificado = localStorage.getItem('token');
          if (!tokenVerificado) {
            throw new Error('Não foi possível salvar o token. Verifique as configurações do navegador.');
          }
        }

        toast.success('Login realizado com sucesso!');
        
        // Aguardar um pouco antes de navegar (igual ao cadastro)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar uma última vez antes de navegar
        const tokenFinal = localStorage.getItem('token');
        if (!tokenFinal) {
          console.error('❌ [LOGIN] Token foi perdido antes de navegar!');
          throw new Error('Erro ao salvar token. Tente novamente.');
        }
        
        console.log('✅ [LOGIN] Token confirmado antes de navegar:', tokenFinal.substring(0, 30) + '...');
        console.log('🔐 [LOGIN] Verificação final antes de navegar:');
        console.log('   CurrentTab (capturado):', currentTab);
        console.log('   RedirectPath (capturado):', redirectPath);
        console.log('   ExpectedUserType:', expectedUserType);
        console.log('   UserType salvo:', localStorage.getItem('userType'));
        console.log('   Token salvo:', !!localStorage.getItem('token'));
        
        // Verificar se o userType está correto antes de navegar
        const userTypeFinal = localStorage.getItem('userType');
        if (userTypeFinal !== expectedUserType) {
          console.error('❌ [LOGIN] UserType incorreto! Corrigindo...');
          console.error('   Esperado:', expectedUserType);
          console.error('   Encontrado:', userTypeFinal);
          console.error('   CurrentTab:', currentTab);
          localStorage.setItem('userType', expectedUserType);
          console.log('✅ [LOGIN] UserType corrigido para:', expectedUserType);
        }
        
        // Redirecionar usando navigate (mesma lógica do cadastro)
        console.log('🚀 [LOGIN] Navegando para:', redirectPath);
        setTimeout(() => {
          console.log('🚀 [LOGIN] Executando navigate para:', redirectPath);
          navigate(redirectPath, { replace: true });
        }, 1000);
      } else {
        console.error('❌ [LOGIN] Token não recebido na resposta:', data);
        throw new Error('Token não recebido');
      }
    } catch (error: any) {
      console.error('❌ [LOGIN] ========== ERRO NO PROCESSO DE LOGIN ==========');
      console.error('❌ [LOGIN] Erro completo:', error);
      console.error('❌ [LOGIN] Stack:', error?.stack);
      console.error('❌ [LOGIN] Message:', error?.message);
      console.error('❌ [LOGIN] Name:', error?.name);
      console.error('❌ [LOGIN] Status:', error?.status);
      console.error('❌ [LOGIN] ================================================');
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
      console.log('🔐 [LOGIN] ========== FIM DO PROCESSO DE LOGIN ==========');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" id="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="bg-primary p-3">
              <Scissors className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-black text-foreground uppercase tracking-tight">Barber Maestro</span>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="owner">Dono</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="owner">
            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="text-foreground font-black uppercase text-xl">Portal do Dono</CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  Acesse o painel de gestão da sua barbearia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={(e) => {
                    console.log('🔐 [LOGIN] Form onSubmit disparado (owner)!');
                    console.log('   Event:', e);
                    handleSubmit(e);
                  }} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="owner-email">Email</Label>
                    <Input
                      id="owner-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.owner.email}
                      onChange={(e) => setFormData({ ...formData, owner: { ...formData.owner, email: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-password">Senha</Label>
                    <Input
                      id="owner-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.owner.senha}
                      onChange={(e) => setFormData({ ...formData, owner: { ...formData.owner, senha: e.target.value } })}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                    onClick={(e) => {
                      console.log('🔐 [LOGIN] Botão "Entrar" clicado (owner)!');
                      console.log('   Event:', e);
                      console.log('   isLoading:', isLoading);
                      console.log('   activeTab:', activeTab);
                      console.log('   formData.owner:', formData.owner);
                    }}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="space-y-2">
                    <p className="text-center text-sm text-muted-foreground">
                      <Link to="/esqueci-senha?tipo=dono" className="text-primary hover:underline">
                        Esqueci minha senha
                      </Link>
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                      Não tem uma conta?{" "}
                      <Link to="/cadastro?tipo=dono" className="text-primary hover:underline">
                        Cadastre-se
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client">
            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="text-foreground font-black uppercase text-xl">Portal do Cliente</CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  Faça login para agendar seus serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.client.email}
                      onChange={(e) => setFormData({ ...formData, client: { ...formData.client, email: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password">Senha</Label>
                    <Input
                      id="client-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.client.senha}
                      onChange={(e) => setFormData({ ...formData, client: { ...formData.client, senha: e.target.value } })}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="space-y-2">
                    <p className="text-center text-sm text-muted-foreground">
                      <Link to="/esqueci-senha?tipo=cliente" className="text-primary hover:underline">
                        Esqueci minha senha
                      </Link>
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                      Primeira vez aqui?{" "}
                      <Link to="/cadastro?tipo=cliente" className="text-primary hover:underline">
                        Criar conta
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link to="/" className="hover:text-primary transition-colors">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
