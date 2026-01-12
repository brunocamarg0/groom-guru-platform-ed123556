import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Cadastro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [formData, setFormData] = useState({
    nomeBarbearia: "",
    nomeContato: "",
    telefone: "",
    email: "",
    senha: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!aceiteTermos) {
      toast({
        title: "Termos não aceitos",
        description: "Você precisa aceitar os termos de condição de uso para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (formData.senha.length < 6 || formData.senha.length > 15) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter entre 6 e 15 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Usar /api diretamente para aproveitar o proxy do Vite em desenvolvimento
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const url = `${apiUrl}/auth/dono/cadastro-direto`;
      
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } catch (fetchError: any) {
        // Erro de rede (backend não está rodando ou CORS)
        console.error('Erro de conexão:', fetchError);
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3001.');
      }

      if (!response) {
        throw new Error('Erro ao conectar com o servidor');
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Erro ao parsear JSON:', jsonError);
          throw new Error('Resposta inválida do servidor. Verifique se o backend está rodando corretamente.');
        }
      } else {
        const text = await response.text();
        console.error('Resposta do servidor (não JSON):', text);
        throw new Error('Resposta inválida do servidor. Verifique se o backend está rodando corretamente.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro');
      }

      // Salvar token no localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        localStorage.setItem('userType', 'dono');
      }

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vindo ao Groom Guru! Redirecionando para seu painel...",
      });

      // Redirecionar para o painel do dono
      setTimeout(() => {
        navigate('/dono');
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erro ao realizar cadastro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary p-3">
                <Scissors className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <p className="text-muted-foreground">
              Cadastre sua barbearia e comece a usar agora
            </p>
          </div>

          <Card className="bg-card border-2 border-border">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-foreground font-black uppercase text-xl">
                Cadastro
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Preencha os dados abaixo para criar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nomeBarbearia">Nome da Barbearia *</Label>
                  <Input
                    id="nomeBarbearia"
                    value={formData.nomeBarbearia}
                    onChange={(e) => setFormData({ ...formData, nomeBarbearia: e.target.value })}
                    placeholder="Nome Da Barbearia*"
                    required
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeContato">Nome do contato *</Label>
                    <Input
                      id="nomeContato"
                      value={formData.nomeContato}
                      onChange={(e) => setFormData({ ...formData, nomeContato: e.target.value })}
                      placeholder="Nome Do Contato (Ex: João da Silva)"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone do Contato *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(11) 96123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email" className="min-h-[2.5rem] flex items-start pt-1">E-mail Para Acesso *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="E-mail Para Acesso"
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="senha" className="min-h-[2.5rem] flex items-start pt-1">Senha (Mínimo de 6 e máximo de 15 caracteres) *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Senha*"
                      minLength={6}
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="termos"
                    checked={aceiteTermos}
                    onCheckedChange={(checked) => setAceiteTermos(checked === true)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="termos"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Li e aceito o{" "}
                      <Link to="/termos" className="text-primary hover:underline">
                        Termo de Condição de Uso
                      </Link>
                      .
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading || !aceiteTermos}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      "CADASTRAR"
                    )}
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Fazer login
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cadastro;
