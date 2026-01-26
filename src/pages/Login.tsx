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

      console.log('🔐 [LOGIN] Fazendo requisição para:', `${API_URL}${endpoint}`);
      console.log('🔐 [LOGIN] Dados enviados:', { email: formData[activeTab as keyof typeof formData].email, senha: '***' });
      
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

      // Salvar token e dados do usuário
      if (data.token) {
        console.log('🔐 [LOGIN] Salvando token no localStorage...');
        localStorage.setItem('token', data.token);
        const userType = activeTab === 'owner' ? 'dono' : activeTab === 'client' ? 'cliente' : 'admin';
        localStorage.setItem('userType', userType);
        console.log('🔐 [LOGIN] Token salvo:', !!localStorage.getItem('token'));
        console.log('🔐 [LOGIN] UserType salvo:', localStorage.getItem('userType'));

        if (data.usuario) {
          localStorage.setItem('user', JSON.stringify(data.usuario));
          console.log('🔐 [LOGIN] Usuário salvo:', data.usuario.email);
        }

        if (data.barbearia) {
          localStorage.setItem('barbearia', JSON.stringify(data.barbearia));
          console.log('🔐 [LOGIN] Barbearia salva:', data.barbearia.id);
        }

        // Aguardar um pouco para garantir que o localStorage foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar se o token foi salvo corretamente (múltiplas verificações)
        let tokenVerificado = localStorage.getItem('token');
        let userTypeVerificado = localStorage.getItem('userType');
        let tentativas = 0;
        const maxTentativas = 10;

        while ((!tokenVerificado || userTypeVerificado !== userType) && tentativas < maxTentativas) {
          tentativas++;
          console.log(`🔐 [LOGIN] Verificação ${tentativas}/${maxTentativas} - Token:`, !!tokenVerificado, 'UserType:', userTypeVerificado);
          
          // Tentar salvar novamente se não estiver presente
          if (!tokenVerificado && data.token) {
            console.log('🔐 [LOGIN] Tentando salvar token novamente...');
            localStorage.setItem('token', data.token);
          }
          if (userTypeVerificado !== userType) {
            console.log('🔐 [LOGIN] Tentando salvar userType novamente...');
            localStorage.setItem('userType', userType);
          }
          
          // Aguardar um pouco antes de verificar novamente
          await new Promise(resolve => setTimeout(resolve, 50));
          
          tokenVerificado = localStorage.getItem('token');
          userTypeVerificado = localStorage.getItem('userType');
        }

        console.log('🔐 [LOGIN] Verificação final - Token:', !!tokenVerificado, 'UserType:', userTypeVerificado);
        console.log('🔐 [LOGIN] Token completo (primeiros 50 chars):', tokenVerificado ? tokenVerificado.substring(0, 50) + '...' : 'null');

        if (!tokenVerificado || userTypeVerificado !== userType) {
          console.error('❌ [LOGIN] Token não foi salvo corretamente após múltiplas tentativas!');
          console.error('   Token esperado:', !!data.token);
          console.error('   Token salvo:', !!tokenVerificado);
          console.error('   UserType esperado:', userType);
          console.error('   UserType salvo:', userTypeVerificado);
          console.error('   Tentativas:', tentativas);
          throw new Error('Erro ao salvar dados de autenticação');
        }

        toast.success('Login realizado com sucesso!');

        // Aguardar um pouco mais antes de navegar para garantir que tudo foi salvo
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verificar uma última vez antes de navegar
        const tokenFinal = localStorage.getItem('token');
        const userTypeFinal = localStorage.getItem('userType');
        console.log('🔐 [LOGIN] Verificação final antes de navegar - Token:', !!tokenFinal, 'UserType:', userTypeFinal);
        console.log('🔐 [LOGIN] Token completo (última verificação):', tokenFinal ? tokenFinal.substring(0, 50) + '...' : 'null');
        
        if (!tokenFinal || userTypeFinal !== userType) {
          console.error('❌ [LOGIN] Token foi perdido antes da navegação!');
          console.error('   Tentando salvar novamente...');
          
          // Última tentativa de salvar
          if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', userType);
            if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
            if (data.barbearia) localStorage.setItem('barbearia', JSON.stringify(data.barbearia));
            
            // Verificar novamente
            const tokenUltimaTentativa = localStorage.getItem('token');
            if (!tokenUltimaTentativa) {
              throw new Error('Não foi possível salvar o token no localStorage. Verifique as configurações do navegador.');
            }
          } else {
            throw new Error('Token não disponível para salvar');
          }
        }

        // Salvar novamente antes de navegar (garantia extra)
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userType', userType);
          if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
          if (data.barbearia) localStorage.setItem('barbearia', JSON.stringify(data.barbearia));
        }

        // Usar window.location.href para garantir que a navegação aconteça
        // e que o localStorage seja preservado (navigate pode ter problemas)
        console.log('🔐 [LOGIN] Navegando para:', redirectPath);
        console.log('🔐 [LOGIN] Token antes de navegar (última verificação):', !!localStorage.getItem('token'));
        console.log('🔐 [LOGIN] UserType antes de navegar:', localStorage.getItem('userType'));
        
        // Usar setTimeout para garantir que o localStorage foi atualizado
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 100);
      } else {
        console.error('❌ [LOGIN] Token não recebido na resposta:', data);
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
