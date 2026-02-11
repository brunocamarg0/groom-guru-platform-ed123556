import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "https://groom-guru-platform-production.up.railway.app/api";

const PLANOS: Record<string, { nome: string; valor: number }> = {
  basico: { nome: "Básico", valor: 97 },
  profissional: { nome: "Profissional", valor: 197 },
  professional: { nome: "Profissional", valor: 197 },
  enterprise: { nome: "Enterprise", valor: 0 },
};

export default function CheckoutAssinatura() {
  const [searchParams] = useSearchParams();
  const planoParam = (searchParams.get("plano") || "basico").toLowerCase().replace(/\s/g, "_");
  const plano = PLANOS[planoParam] ? planoParam : "basico";
  const { nome: nomePlano, valor } = PLANOS[plano] || PLANOS.basico;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha nome e email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pagamentos/preferencia-assinatura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano, nome: nome.trim(), email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || data?.detalhes || "Erro ao processar compra da assinatura";
        toast.error(msg, {
          description: data?.detalhes && data?.error ? data.detalhes : undefined,
        });
        setLoading(false);
        return;
      }

      if (data.initPoint) {
        toast.success("Redirecionando para o Mercado Pago...");
        window.location.href = data.initPoint;
        return;
      }
      toast.error("Erro ao processar compra da assinatura", {
        description: "Resposta inválida do servidor.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar compra da assinatura", {
        description: err instanceof Error ? err.message : "Verifique sua conexão e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (valor === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-md mx-auto py-16 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Plano Enterprise</CardTitle>
              <CardDescription>Valor personalizado. Entre em contato para fechar sua assinatura.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-md mx-auto py-12 px-4">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/#planos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos planos
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinar agora – Pagamento real
            </CardTitle>
            <CardDescription>
              Plano <strong>{nomePlano}</strong> – R$ {valor.toFixed(2).replace(".", ",")}/mês. Você será redirecionado ao Mercado Pago para pagar com cartão, PIX ou boleto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Pagar com Mercado Pago"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
