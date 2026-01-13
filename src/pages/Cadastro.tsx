import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Debug: Log da URL sendo usada
const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';
console.log('🔍 API_URL configurada:', API_URL);
console.log('🔍 VITE_API_URL env:', import.meta.env.VITE_API_URL);

const Cadastro = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'dono'; // 'dono' ou 'cliente'
  
  const [isLoading, setIsLoading] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  
  // Formulário para dono
  const [formDono, setFormDono] = useState({
    nomeBarbearia: "",
    nomeContato: "",
    telefone: "",
    email: "",
    senha: "",
  });
  
  // Formulário para cliente
  const [formCliente, setFormCliente] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    dataNascimento: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!aceiteTermos) {
      toast.error("Você precisa aceitar os termos de condição de uso para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      let url = '';
      let body: any = {};
      let redirectPath = '';

      if (tipo === 'dono') {
        // Validação específica para dono
        if (formDono.senha.length < 6 || formDono.senha.length > 15) {
          toast.error("A senha deve ter entre 6 e 15 caracteres.");
          setIsLoading(false);
          return;
        }

        url = `${API_URL}/auth/dono/cadastro-direto`;
        body = {
          nomeBarbearia: formDono.nomeBarbearia,
          nomeContato: formDono.nomeContato,
          telefone: formDono.telefone,
          email: formDono.email,
          senha: formDono.senha,
        };
        redirectPath = '/dono';
      } else {
        // Validação específica para cliente
        if (!formCliente.nome || !formCliente.email || !formCliente.senha) {
          toast.error("Preencha todos os campos obrigatórios.");
          setIsLoading(false);
          return;
        }

        if (formCliente.senha.length < 6) {
          toast.error("A senha deve ter no mínimo 6 caracteres.");
          setIsLoading(false);
          return;
        }

        url = `${API_URL}/auth/cliente/registro`;
        body = {
          nome: formCliente.nome,
          email: formCliente.email,
          senha: formCliente.senha,
          telefone: formCliente.telefone || null,
          dataNascimento: formCliente.dataNascimento || null,
        };
        redirectPath = '/client';
      }

      console.log('🔍 Tentando conectar em:', url);
      
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'include',
          body: JSON.stringify(body),
        });
      } catch (fetchError: any) {
        // Erro de rede (backend não está rodando ou CORS)
        console.error('Erro de conexão:', fetchError);
        console.error('URL tentada:', url);
        console.error('API_URL configurada:', API_URL);
        console.error('VITE_API_URL:', import.meta.env.VITE_API_URL);
        
        // Mensagem mais específica
        if (fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
          throw new Error(`Não foi possível conectar ao servidor. URL: ${url}. Verifique se o backend está online e se CORS está configurado.`);
        }
        throw new Error(`Não foi possível conectar ao servidor. URL: ${url}. Verifique se o backend está online.`);
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
          const text = await response.text();
          console.error('Resposta do servidor:', text);
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
        localStorage.setItem('userType', tipo === 'dono' ? 'dono' : 'cliente');
        
        if (data.barbearia) {
          localStorage.setItem('barbearia', JSON.stringify(data.barbearia));
        }
      }

      toast.success('Cadastro realizado com sucesso!');
      
      // Redirecionar
      setTimeout(() => {
        navigate(redirectPath);
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao realizar cadastro:', error);
      toast.error(error.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" id="cadastro-page">
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
              {tipo === 'dono' 
                ? 'Cadastre sua barbearia e comece a usar agora'
                : 'Crie sua conta e agende seus serviços'}
            </p>
          </div>

          <Card className="bg-card border-2 border-border">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-foreground font-black uppercase text-xl">
                {tipo === 'dono' ? 'Cadastro de Barbearia' : 'Cadastro de Cliente'}
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Preencha os dados abaixo para criar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {tipo === 'dono' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nomeBarbearia">Nome da Barbearia *</Label>
                      <Input
                        id="nomeBarbearia"
                        value={formDono.nomeBarbearia}
                        onChange={(e) => setFormDono({ ...formDono, nomeBarbearia: e.target.value })}
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
                          value={formDono.nomeContato}
                          onChange={(e) => setFormDono({ ...formDono, nomeContato: e.target.value })}
                          placeholder="Nome Do Contato (Ex: João da Silva)"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone do Contato *</Label>
                        <Input
                          id="telefone"
                          value={formDono.telefone}
                          onChange={(e) => setFormDono({ ...formDono, telefone: e.target.value })}
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
                          value={formDono.email}
                          onChange={(e) => setFormDono({ ...formDono, email: e.target.value })}
                          placeholder="E-mail Para Acesso"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="senha" className="min-h-[2.5rem] flex items-start pt-1">Senha (Mínimo de 6 e máximo de 15 caracteres) *</Label>
                        <Input
                          id="senha"
                          type="password"
                          value={formDono.senha}
                          onChange={(e) => setFormDono({ ...formDono, senha: e.target.value })}
                          placeholder="Senha*"
                          minLength={6}
                          maxLength={15}
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        value={formCliente.nome}
                        onChange={(e) => setFormCliente({ ...formCliente, nome: e.target.value })}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-cliente">E-mail *</Label>
                        <Input
                          id="email-cliente"
                          type="email"
                          value={formCliente.email}
                          onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone-cliente">Telefone</Label>
                        <Input
                          id="telefone-cliente"
                          value={formCliente.telefone}
                          onChange={(e) => setFormCliente({ ...formCliente, telefone: e.target.value })}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="senha-cliente">Senha (Mínimo 6 caracteres) *</Label>
                        <Input
                          id="senha-cliente"
                          type="password"
                          value={formCliente.senha}
                          onChange={(e) => setFormCliente({ ...formCliente, senha: e.target.value })}
                          placeholder="Senha"
                          minLength={6}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formCliente.dataNascimento}
                          onChange={(e) => setFormCliente({ ...formCliente, dataNascimento: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

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
