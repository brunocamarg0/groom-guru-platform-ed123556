import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, CreditCard, AlertCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Stats {
  barbearias: number;
  clientes: number;
  assinaturasAtivas: number;
  ticketsAbertos: number;
}

export default function SuperAdminDashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ barbearias: 0, clientes: 0, assinaturasAtivas: 0, ticketsAbertos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [b, c, a, t] = await Promise.all([
        supabase.from("barbearias").select("id", { count: "exact", head: true }),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("assinaturas").select("id", { count: "exact", head: true }).eq("status", "ativa"),
        supabase.from("tickets_suporte").select("id", { count: "exact", head: true }).eq("status", "aberto"),
      ]);
      setStats({
        barbearias: b.count ?? 0,
        clientes: c.count ?? 0,
        assinaturasAtivas: a.count ?? 0,
        ticketsAbertos: t.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Barbearias", value: stats.barbearias, icon: Building2, color: "text-blue-500" },
    { label: "Clientes", value: stats.clientes, icon: Users, color: "text-green-500" },
    { label: "Assinaturas ativas", value: stats.assinaturasAtivas, icon: CreditCard, color: "text-purple-500" },
    { label: "Tickets abertos", value: stats.ticketsAbertos, icon: AlertCircle, color: "text-orange-500" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Super-Admin</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "..." : c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Migração Lovable Cloud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Banco de dados migrado (24 tabelas)</p>
            <p>✅ Auth ativo (email/senha + Google)</p>
            <p>✅ RLS multi-tenant configurado</p>
            <p>🔄 Próximo: migrar painéis Dono, Profissional, Cliente para usar o novo backend</p>
            <p>🔄 Próximo: edge functions Mercado Pago</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
