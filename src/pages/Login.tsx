import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("client");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Estados para formulários
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerBarbeariaId, setOwnerBarbeariaId] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isRegisterMode ? "/auth/cliente/registro" : "/auth/cliente/login";
      const body = isRegisterMode
        ? { nome: clientName, email: clientEmail, senha: clientPassword, telefone: clientPhone || undefined }
        : { email: clientEmail, senha: clientPassword };

      const response = await fetch(`${API_URL}/api${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      // Salvar token
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", "cliente");
        localStorage.setItem("userData", JSON.stringify(data.usuario));
      }

      navigate("/cliente", { replace: true });
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Verificação local sem API
      const emailCorreto = 'wesley.teste@hotmail.com';
      const senhaCorreta = 'teste 123';

      if (isRegisterMode) {
        setError("Registro de dono requer criação de barbearia pelo admin primeiro");
        setIsLoading(false);
        return;
      }

      // Verificar credenciais localmente
      if (ownerEmail !== emailCorreto || ownerPassword !== senhaCorreta) {
        throw new Error("Email ou senha incorretos");
      }

      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 500));

      // Salvar dados fictícios no localStorage
      localStorage.setItem("token", "demo-token-dono-wesley");
      localStorage.setItem("userType", "dono");
      localStorage.setItem("userData", JSON.stringify({
        id: "wesley-dono-id",
        nome: "Wesley",
        email: emailCorreto,
        barbeariaId: "wesley-barbearia-id"
      }));

      navigate("/dono", { replace: true });
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: adminEmail, senha: adminPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      // Salvar token
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userType", "admin");
        localStorage.setItem("userData", JSON.stringify(data.usuario));
      }

      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
    setIsRegisterMode(false);
  };

  const handleGoogleLogin = (type: 'cliente' | 'dono') => {
    if (type === 'cliente') {
      window.location.href = `${API_URL}/api/auth/google/cliente`;
    } else if (type === 'dono') {
      // Para dono, precisa do barbeariaId - por enquanto redireciona sem
      // O usuário pode preencher depois ou adicionar um input
      const barbeariaId = prompt("Digite o ID da barbearia:");
      if (barbeariaId) {
        window.location.href = `${API_URL}/api/auth/google/dono?barbeariaId=${barbeariaId}`;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="bg-primary p-3">
              <Scissors className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-black text-foreground uppercase tracking-tight">BarberPro</span>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); resetError(); }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="owner">Dono</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="owner">
            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="text-foreground font-black uppercase text-xl">
                  {isRegisterMode ? "Cadastro do Dono" : "Portal do Dono"}
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  {isRegisterMode
                    ? "Crie sua conta de dono (necessita ID da barbearia)"
                    : "Acesse o painel de gestão da sua barbearia"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOwnerSubmit} className="space-y-4">
                  {isRegisterMode && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="owner-name">Nome</Label>
                        <Input
                          id="owner-name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner-barbearia-id">ID da Barbearia</Label>
                        <Input
                          id="owner-barbearia-id"
                          type="text"
                          placeholder="ID da barbearia (fornecido pelo admin)"
                          value={ownerBarbeariaId}
                          onChange={(e) => setOwnerBarbeariaId(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          O admin precisa criar a barbearia primeiro e fornecer o ID
                        </p>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="owner-email">Email</Label>
                    <Input
                      id="owner-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-password">Senha</Label>
                    <Input
                      id="owner-password"
                      type="password"
                      placeholder="••••••••"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (isRegisterMode ? "Cadastrando..." : "Entrando...") : (isRegisterMode ? "Cadastrar" : "Entrar")}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    {isRegisterMode ? (
                      <>
                        Já tem uma conta?{" "}
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(false)}
                          className="text-primary hover:underline"
                        >
                          Fazer login
                        </button>
                      </>
                    ) : (
                      <>
                        Não tem uma conta?{" "}
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(true)}
                          className="text-primary hover:underline"
                        >
                          Cadastre-se
                        </button>
                      </>
                    )}
                  </p>
                  {!isRegisterMode && (
                    <div className="pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          // Salvar dados fictícios no localStorage para o contexto funcionar
                          localStorage.setItem("token", "demo-token-dono");
                          localStorage.setItem("userType", "dono");
                          localStorage.setItem("userData", JSON.stringify({
                            id: "demo-dono-id",
                            nome: "Wesley",
                            email: "wesley.teste@hotmail.com",
                            barbeariaId: "demo-barbearia-id"
                          }));
                          navigate("/dono", { replace: true });
                        }}
                      >
                        Acessar Painel do Dono (Visualização)
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Modo de demonstração - sem autenticação real
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client">
            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="text-foreground font-black uppercase text-xl">
                  {isRegisterMode ? "Cadastro de Cliente" : "Portal do Cliente"}
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">
                  {isRegisterMode
                    ? "Crie sua conta para agendar serviços"
                    : "Faça login para agendar seus serviços"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClientSubmit} className="space-y-4">
                  {isRegisterMode && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="client-name">Nome</Label>
                        <Input
                          id="client-name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-phone">Telefone (opcional)</Label>
                        <Input
                          id="client-phone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password">Senha</Label>
                    <Input
                      id="client-password"
                      type="password"
                      placeholder="••••••••"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {!isRegisterMode && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleGoogleLogin('cliente')}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Entrar com Google
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Ou</span>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (isRegisterMode ? "Cadastrando..." : "Entrando...") : (isRegisterMode ? "Cadastrar" : "Entrar")}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    {isRegisterMode ? (
                      <>
                        Já tem uma conta?{" "}
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(false)}
                          className="text-primary hover:underline"
                        >
                          Fazer login
                        </button>
                      </>
                    ) : (
                      <>
                        Primeira vez aqui?{" "}
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(true)}
                          className="text-primary hover:underline"
                        >
                          Criar conta
                        </button>
                      </>
                    )}
                  </p>
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
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@barberpro.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Senha</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
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
