import { useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Obter tab da URL ou usar 'owner' como padrão
  const tabFromUrl = searchParams.get('tab');
  const getInitialTab = () => {
    if (tabFromUrl === 'client') return 'client';
    if (tabFromUrl === 'admin') return 'admin';
    return 'owner';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Estados para formulários
  const [formData, setFormData] = useState({
    owner: { email: "", senha: "" },
    client: { email: "", senha: "" },
    admin: { email: "", senha: "" },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let endpoint = '';
      let redirectPath = '';

      if (activeTab === 'owner') {
        endpoint = '/auth/dono/login';
        redirectPath = '/dono';
      } else if (activeTab === 'client') {
        endpoint = '/auth/cliente/login';
        redirectPath = '/cliente';
      } else if (activeTab === 'admin') {
        endpoint = '/auth/admin/login';
        redirectPath = '/admin';
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔐 [LOGIN] ========== INICIANDO LOGIN ==========');
      console.log('   Endpoint:', endpoint);
      console.log('   ActiveTab:', activeTab);
      console.log('   API_URL:', API_URL);
      console.log('   Email:', formData[activeTab as keyof typeof formData].email);
      console.log('═══════════════════════════════════════════════════════════');
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData[activeTab as keyof typeof formData]),
      });

      console.log('🔐 [LOGIN] Resposta recebida:', { status: response.status, ok: response.ok });

      let data;
      try {
        data = await response.json();
        console.log('🔐 [LOGIN] Dados recebidos:', { 
          temToken: !!data.token, 
          temUsuario: !!data.usuario, 
          temBarbearia: !!data.barbearia,
          sucesso: data.sucesso 
        });
      } catch (parseError) {
        console.error('❌ [LOGIN] Erro ao parsear resposta JSON:', parseError);
        const text = await response.text();
        console.error('❌ [LOGIN] Resposta como texto:', text);
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        console.error('❌ [LOGIN] Erro na resposta:', data);
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Salvar token e dados do usuário
      if (data.token) {
        console.log('✅ [LOGIN] Token recebido, salvando no localStorage...');
        console.log('   Token recebido (primeiros 50 chars):', data.token.substring(0, 50) + '...');
        console.log('   Token recebido (tamanho):', data.token.length);
        
        try {
          // Limpar localStorage antes de salvar (para evitar problemas)
          console.log('🧹 [LOGIN] Limpando localStorage antigo...');
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          localStorage.removeItem('user');
          localStorage.removeItem('barbearia');
          
          // Aguardar um pouco antes de salvar
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Salvar token
          const userTypeValue = activeTab === 'owner' ? 'dono' : activeTab === 'client' ? 'cliente' : 'admin';
          console.log('💾 [LOGIN] Salvando token...');
          localStorage.setItem('token', data.token);
          console.log('💾 [LOGIN] Salvando userType:', userTypeValue);
          localStorage.setItem('userType', userTypeValue);
          
          // Verificar imediatamente após salvar
          const tokenTeste = localStorage.getItem('token');
          const userTypeTeste = localStorage.getItem('userType');
          console.log('✅ [LOGIN] Verificação imediata após salvar:');
          console.log('   Token salvo:', !!tokenTeste);
          console.log('   UserType salvo:', userTypeTeste);
          console.log('   Token (primeiros 30 chars):', tokenTeste ? tokenTeste.substring(0, 30) + '...' : 'N/A');
          
          if (!tokenTeste) {
            throw new Error('Token não foi salvo no localStorage!');
          }

          if (data.usuario) {
            console.log('✅ [LOGIN] Salvando dados do usuário:', data.usuario);
            localStorage.setItem('user', JSON.stringify(data.usuario));
          }

          if (data.barbearia) {
            console.log('✅ [LOGIN] Salvando dados da barbearia:', data.barbearia);
            localStorage.setItem('barbearia', JSON.stringify(data.barbearia));
          }
        } catch (storageError: any) {
          console.error('❌ [LOGIN] Erro ao salvar no localStorage:', storageError);
          throw new Error(`Erro ao salvar dados: ${storageError.message}`);
        }

        toast.success('Login realizado com sucesso!');

        // Verificar se os dados foram salvos corretamente - múltiplas verificações
        let tokenVerificado = localStorage.getItem('token');
        let userTypeVerificado = localStorage.getItem('userType');
        console.log('✅ [LOGIN] Verificação pós-salvamento (1ª tentativa):');
        console.log('   Token salvo:', !!tokenVerificado);
        console.log('   UserType salvo:', userTypeVerificado);
        console.log('   Token (primeiros 30 chars):', tokenVerificado ? tokenVerificado.substring(0, 30) + '...' : 'N/A');
        
        // Se não encontrou, tentar salvar novamente
        if (!tokenVerificado) {
          console.warn('⚠️ [LOGIN] Token não encontrado na primeira verificação, tentando salvar novamente...');
          localStorage.setItem('token', data.token);
          localStorage.setItem('userType', activeTab === 'owner' ? 'dono' : activeTab === 'client' ? 'cliente' : 'admin');
          tokenVerificado = localStorage.getItem('token');
          userTypeVerificado = localStorage.getItem('userType');
          console.log('✅ [LOGIN] Verificação pós-salvamento (2ª tentativa):');
          console.log('   Token salvo:', !!tokenVerificado);
          console.log('   UserType salvo:', userTypeVerificado);
        }

        // Delay maior para garantir que os dados sejam salvos no localStorage
        // e que o navegador tenha tempo de processar
        console.log('✅ [LOGIN] Redirecionando para:', redirectPath);
        setTimeout(() => {
          try {
            // Verificar novamente antes de navegar
            const tokenFinal = localStorage.getItem('token');
            const userTypeFinal = localStorage.getItem('userType');
            
            console.log('✅ [LOGIN] Verificação final antes de navegar:');
            console.log('   Token:', !!tokenFinal);
            console.log('   UserType:', userTypeFinal);
            console.log('   Token (primeiros 30 chars):', tokenFinal ? tokenFinal.substring(0, 30) + '...' : 'N/A');
            
            if (!tokenFinal || userTypeFinal !== (activeTab === 'owner' ? 'dono' : activeTab === 'client' ? 'cliente' : 'admin')) {
              console.error('❌ [LOGIN] Token ou userType não encontrado antes de navegar!');
              console.error('   Token:', tokenFinal);
              console.error('   UserType:', userTypeFinal);
              console.error('   Esperado:', activeTab === 'owner' ? 'dono' : activeTab === 'client' ? 'cliente' : 'admin');
              
              // Tentar salvar uma última vez
              localStorage.setItem('token', data.token);
              localStorage.setItem('userType', activeTab === 'owner' ? 'dono' : activeTab === 'client' ? 'cliente' : 'admin');
              
              // Verificar novamente
              const tokenUltimaTentativa = localStorage.getItem('token');
              if (!tokenUltimaTentativa) {
                toast.error('Erro ao salvar token. Tente fazer login novamente.');
                setIsLoading(false);
                return;
              }
            }
            
            // Forçar atualização do estado antes de navegar
            window.dispatchEvent(new Event('localStorageChange'));
            
            navigate(redirectPath);
          } catch (navError) {
            console.error('❌ [LOGIN] Erro ao navegar:', navError);
            // Fallback: recarregar a página
            window.location.href = redirectPath;
          }
        }, 500);
      } else {
        console.error('❌ [LOGIN] Token não recebido na resposta');
        throw new Error('Token não recebido');
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
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
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="owner">Dono</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
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
                <form onSubmit={handleSubmit} className="space-y-4">
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

          <TabsContent value="admin">
            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="text-foreground font-black uppercase text-xl">Portal Admin</CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  Acesso restrito para administradores do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@barbermaster.com"
                      value={formData.admin.email}
                      onChange={(e) => setFormData({ ...formData, admin: { ...formData.admin, email: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Senha</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.admin.senha}
                      onChange={(e) => setFormData({ ...formData, admin: { ...formData.admin, senha: e.target.value } })}
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
