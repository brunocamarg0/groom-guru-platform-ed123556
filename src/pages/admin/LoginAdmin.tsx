import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Shield, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';

export default function LoginAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 [ADMIN LOGIN] Iniciando login admin...');
      
      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      if (!data.token) {
        throw new Error('Token não recebido do servidor');
      }

      // Salvar token e dados
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', 'admin');
      if (data.usuario) {
        localStorage.setItem('user', JSON.stringify(data.usuario));
      }

      console.log('✅ [ADMIN LOGIN] Login realizado com sucesso');
      toast.success('Login admin realizado com sucesso!');
      
      // Navegar para o painel admin
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 500);
    } catch (error: any) {
      console.error('❌ [ADMIN LOGIN] Erro:', error);
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
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
            <span className="text-3xl font-black text-foreground uppercase tracking-tight">Barber Maestro</span>
          </Link>
        </div>

        <Card className="bg-card border-2 border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground font-black uppercase text-xl">Acesso Administrativo</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground font-medium">
              Área restrita para administradores do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar como Administrador"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Voltar para login normal
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
