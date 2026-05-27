import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { buscarCep, formatarCep } from "@/lib/viacep";


const Cadastro = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'dono'; // 'dono' ou 'cliente'
  
  const [isLoading, setIsLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);

  const handleCepChange = async (raw: string) => {
    const formatted = formatarCep(raw);
    setFormDono((prev) => ({ ...prev, cep: formatted }));
    if (formatted.replace(/\D/g, "").length === 8) {
      setBuscandoCep(true);
      const end = await buscarCep(formatted);
      setBuscandoCep(false);
      if (end) {
        setFormDono((prev) => ({
          ...prev,
          endereco: end.logradouro || prev.endereco,
          bairro: end.bairro || prev.bairro,
          cidade: end.cidade ? `${end.cidade}${end.uf ? "/" + end.uf : ""}` : prev.cidade,
        }));
        toast.success("Endereço encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    }
  };

  
  // Formulário para dono
  const [formDono, setFormDono] = useState({
    nomeBarbearia: "",
    nomeContato: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    endereco: "",
    bairro: "",
    cidade: "",
    cep: "",
  });
  
  // Formulário para cliente
  const [formCliente, setFormCliente] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    dataNascimento: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aceiteTermos) {
      toast.error("Você precisa aceitar os termos de condição de uso para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      let redirectPath = '';

      if (tipo === 'dono') {
        if (formDono.senha.length < 6 || formDono.senha.length > 15) {
          toast.error("A senha deve ter entre 6 e 15 caracteres.");
          setIsLoading(false);
          return;
        }
        if (formDono.senha !== formDono.confirmarSenha) {
          toast.error("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }
        if (!formDono.bairro || !formDono.cidade) {
          toast.error("Bairro e Cidade são obrigatórios para que clientes possam encontrar sua barbearia.");
          setIsLoading(false);
          return;
        }

        // Chama edge function que cria auth user + barbearia + role owner
        const { data, error } = await supabase.functions.invoke('signup-dono', {
          body: {
            nomeBarbearia: formDono.nomeBarbearia,
            nomeContato: formDono.nomeContato,
            telefone: formDono.telefone,
            email: formDono.email,
            senha: formDono.senha,
            endereco: formDono.endereco || null,
            bairro: formDono.bairro,
            cidade: formDono.cidade,
            cep: formDono.cep || null,
          },
        });

        // Extrai mensagem real do corpo da resposta, mesmo em status não-2xx
        let serverMsg: string | null = (data as any)?.error ?? null;
        if (!serverMsg && error) {
          try {
            const ctx: any = (error as any).context;
            if (ctx) {
              if (typeof ctx.json === "function") {
                const body = await ctx.json().catch(() => null);
                serverMsg = body?.error || body?.message || null;
              } else if (typeof ctx.text === "function") {
                const txt = await ctx.text().catch(() => "");
                try { serverMsg = JSON.parse(txt)?.error || txt; } catch { serverMsg = txt; }
              } else if (typeof ctx === "string") {
                try { serverMsg = JSON.parse(ctx)?.error || ctx; } catch { serverMsg = ctx; }
              }
            }
          } catch {/* ignore */}
        }

        if (error || (data as any)?.error) {
          let friendly = serverMsg || error?.message || 'Erro ao realizar cadastro';
          if (/already|exists|registered|registrad/i.test(friendly)) {
            friendly = 'Este e-mail já está cadastrado. Tente fazer login.';
          }
          throw new Error(friendly);
        }

        // Login automático após cadastro
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: formDono.email.trim(),
          password: formDono.senha,
        });
        if (signInErr) throw signInErr;

        redirectPath = '/dono';
      } else {
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
        if (formCliente.senha !== formCliente.confirmarSenha) {
          toast.error("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }

        // Cliente: signUp normal (trigger handle_new_user cria role 'client' + clientes)
        const { error } = await supabase.auth.signUp({
          email: formCliente.email.trim(),
          password: formCliente.senha,
          options: {
            emailRedirectTo: `${window.location.origin}/cliente`,
            data: {
              nome: formCliente.nome,
              telefone: formCliente.telefone || null,
              data_nascimento: formCliente.dataNascimento || null,
            },
          },
        });

        if (error) {
          const msg = error.message?.toLowerCase().includes('already')
            ? 'Este email já está cadastrado.'
            : error.message;
          throw new Error(msg || 'Erro ao realizar cadastro');
        }

        redirectPath = '/cliente';
      }

      toast.success('Cadastro realizado com sucesso!');
      setTimeout(() => navigate(redirectPath), 800);
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                      <Input
                        id="confirmarSenha"
                        type="password"
                        value={formDono.confirmarSenha}
                        onChange={(e) => setFormDono({ ...formDono, confirmarSenha: e.target.value })}
                        placeholder="Repita a senha"
                        minLength={6}
                        maxLength={15}
                        required
                      />
                      {formDono.confirmarSenha && formDono.senha !== formDono.confirmarSenha && (
                        <p className="text-xs text-destructive">As senhas não coincidem.</p>
                      )}
                    </div>

                    {/* Campos de Localização - Obrigatórios para busca */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="endereco">Endereço (Rua e Número)</Label>
                      <Input
                        id="endereco"
                        value={formDono.endereco}
                        onChange={(e) => setFormDono({ ...formDono, endereco: e.target.value })}
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro *</Label>
                        <Input
                          id="bairro"
                          value={formDono.bairro}
                          onChange={(e) => setFormDono({ ...formDono, bairro: e.target.value })}
                          placeholder="Bairro"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Obrigatório para que clientes encontrem sua barbearia
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade *</Label>
                        <Input
                          id="cidade"
                          value={formDono.cidade}
                          onChange={(e) => setFormDono({ ...formDono, cidade: e.target.value })}
                          placeholder="Cidade"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Obrigatório para que clientes encontrem sua barbearia
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <div className="relative">
                          <Input
                            id="cep"
                            value={formDono.cep}
                            onChange={(e) => handleCepChange(e.target.value)}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          {buscandoCep && (
                            <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Digite o CEP para preencher o endereço automaticamente
                        </p>
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
