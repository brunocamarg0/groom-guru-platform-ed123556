import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const EsqueciSenha = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get('tipo') || 'cliente';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Se o email estiver cadastrado, você receberá um link para redefinir sua senha.');
      setEmailEnviado(true);
    } catch (error: any) {
      console.error('[ESQUECI SENHA] erro:', error);
      toast.error(error.message || 'Erro ao solicitar recuperação de senha.');
    } finally {
      setIsLoading(false);
    }
  };


  if (emailEnviado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="bg-primary p-3">
                <Scissors className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="text-3xl font-black text-foreground uppercase tracking-tight">Barber Maestro</span>
            </Link>
          </div>

          <Card className="bg-card border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground font-black uppercase text-xl text-center">
                Email Enviado!
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium text-center">
                Verifique sua caixa de entrada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique no link recebido para criar uma nova senha.
                </p>

              </div>
              <Button
                variant="hero"
                className="w-full"
                onClick={() => navigate(tipo === 'dono' ? '/login?tab=owner' : '/login?tab=client')}
              >
                Voltar para Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="bg-primary p-3">
              <Scissors className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-black text-foreground uppercase tracking-tight">Barber Maestro</span>
          </Link>
        </div>

        <Card className="bg-card border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-black uppercase text-xl">
              Esqueci Minha Senha
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              {tipo === 'dono'
                ? 'Digite seu email para receber uma nova senha'
                : 'Digite seu email para receber uma nova senha'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Nova Senha"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Lembrou sua senha?{" "}
                <Link
                  to={`/login?tab=${tipo === 'dono' ? 'owner' : 'client'}`}
                  className="text-primary hover:underline"
                >
                  Fazer login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link to="/" className="hover:text-primary transition-colors">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EsqueciSenha;

