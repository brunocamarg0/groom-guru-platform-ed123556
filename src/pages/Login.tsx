import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ portal: "owner" | "client"; userId: string } | null>(null);
  const { user, roles, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('tab');
  const getInitialTab = () => (tabFromUrl === 'client' ? 'client' : 'owner');

  const [activeTab, setActiveTab] = useState(getInitialTab());

  const [formData, setFormData] = useState({
    owner: { email: "", senha: "" },
    client: { email: "", senha: "" },
  });

  useEffect(() => {
    if (!pendingLogin || authLoading || !user) return;
    if (user.id !== pendingLogin.userId) return;

    const roleSet = new Set(roles);
    const expectedRole = pendingLogin.portal === "owner" ? "owner" : "client";

    if (roleSet.has(expectedRole)) {
      toast.success("Login realizado com sucesso!");
      navigate(pendingLogin.portal === "owner" ? "/dono" : "/cliente", { replace: true });
      setPendingLogin(null);
      setIsLoading(false);
      return;
    }

    if (roleSet.has("super_admin") && roleSet.size === 1) {
      toast.success("Login realizado com sucesso!");
      navigate("/super-admin", { replace: true });
      setPendingLogin(null);
      setIsLoading(false);
      return;
    }

    const rejectAccess = async () => {
      await signOut();
      toast.error(
        pendingLogin.portal === "owner"
          ? "Esta conta não tem acesso ao Portal do Dono."
          : "Esta conta não tem acesso ao Portal do Cliente."
      );
      setPendingLogin(null);
      setIsLoading(false);
    };

    void rejectAccess();
  }, [pendingLogin, authLoading, user, roles, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentTab = activeTab as 'owner' | 'client';
    const { email, senha } = formData[currentTab];

    setIsLoading(true);
    let shouldKeepLoading = false;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error || !data.user) {
        throw new Error(error?.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos.'
          : (error?.message || 'Erro ao fazer login.'));
      }

      shouldKeepLoading = true;
      setPendingLogin({ portal: currentTab, userId: data.user.id });
    } catch (err: any) {
      console.error('[LOGIN] erro:', err);
      toast.error(err.message || 'Erro ao fazer login.');
    } finally {
      if (!shouldKeepLoading) {
        setIsLoading(false);
      }
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
