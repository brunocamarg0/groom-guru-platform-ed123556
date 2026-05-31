import { useState, useEffect } from "react";
import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Check,
  CreditCard,
  Calendar,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Plano {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  duracaoMeses: number;
  beneficios: string[];
  barbearia: {
    id: string;
    nome: string;
  };
}

export default function PlanosDisponiveis() {
  const { cliente, barbearias } = useCliente();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [barbeariaSelecionada, setBarbeariaSelecionada] = useState<string | null>(null);
  const [comprando, setComprando] = useState<string | null>(null);
  const [modoTeste, setModoTeste] = useState(false);

  useEffect(() => {
    carregarPlanos();
  }, [barbeariaSelecionada]);

  const carregarPlanos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("planos_cliente")
        .select(
          "id, nome, descricao, valor, duracao_meses, beneficios, barbearia_id, ativo, barbearia:barbearias(id, nome)"
        )
        .eq("ativo", true);
      if (barbeariaSelecionada) query = query.eq("barbearia_id", barbeariaSelecionada);

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Plano[] = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao ?? undefined,
        valor: Number(p.valor),
        duracaoMeses: Number(p.duracao_meses),
        beneficios: Array.isArray(p.beneficios) ? p.beneficios : [],
        barbearia: {
          id: p.barbearia?.id ?? p.barbearia_id,
          nome: p.barbearia?.nome ?? "Barbearia",
        },
      }));
      setPlanos(mapped);
    } catch (error: any) {
      console.error("Erro ao carregar planos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos disponíveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComprar = async (plano: Plano) => {
    if (!cliente?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comprar um plano",
        variant: "destructive",
      });
      return;
    }

    setComprando(plano.id);
    try {
      if (modoTeste) {
        const { data, error } = await supabase.functions.invoke(
          "mercadopago-plano-cliente-checkout",
          { body: { planoId: plano.id, pagamentoRecorrente: false, modoTeste: true } },
        );
        let backendMessage = (data as any)?.message || "Assinatura criada em modo teste";
        if (error) {
          const ctx: any = (error as any).context;
          if (ctx?.json) {
            const body = await ctx.json().catch(() => null);
            backendMessage = body?.message || body?.error || backendMessage;
          } else if (ctx?.text) {
            const text = await ctx.text().catch(() => "");
            try {
              const body = JSON.parse(text);
              backendMessage = body?.message || body?.error || backendMessage;
            } catch {
              backendMessage = text || backendMessage;
            }
          }
          throw new Error(backendMessage);
        }
        toast({ title: "Sucesso!", description: backendMessage });
        setTimeout(() => navigate("/cliente/assinatura"), 1200);
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "mercadopago-plano-cliente-checkout",
        { body: { planoId: plano.id, pagamentoRecorrente: false } },
      );
      if (error) {
        let backendMessage = error.message || "Erro ao processar compra do plano";
        const ctx: any = (error as any).context;
        if (ctx?.json) {
          const body = await ctx.json().catch(() => null);
          backendMessage = body?.message || body?.error || backendMessage;
        } else if (ctx?.text) {
          const text = await ctx.text().catch(() => "");
          try {
            const body = JSON.parse(text);
            backendMessage = body?.message || body?.error || backendMessage;
          } catch {
            backendMessage = text || backendMessage;
          }
        }
        throw new Error(backendMessage);
      }
      if ((data as any)?.error === "mp_nao_conectado") {
        toast({
          title: "Pagamento indisponível",
          description: (data as any).message,
          variant: "destructive",
        });
        return;
      }
      const link = (data as any)?.initPoint || (data as any)?.sandboxInitPoint;
      if (link) {
        window.location.href = link;
      } else {
        throw new Error((data as any)?.error || "Não foi possível gerar o link de pagamento");
      }
    } catch (error: any) {
      console.error("Erro ao comprar plano:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar compra do plano",
        variant: "destructive",
      });
    } finally {
      setComprando(null);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Agrupar planos por barbearia
  const planosPorBarbearia = planos.reduce((acc, plano) => {
    if (!acc[plano.barbearia.id]) {
      acc[plano.barbearia.id] = {
        barbearia: plano.barbearia,
        planos: [],
      };
    }
    acc[plano.barbearia.id].planos.push(plano);
    return acc;
  }, {} as Record<string, { barbearia: { id: string; nome: string }; planos: Plano[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando planos disponíveis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planos Disponíveis</h2>
          <p className="text-muted-foreground">
            Escolha o plano ideal para você e aproveite benefícios exclusivos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="modo-teste"
            checked={modoTeste}
            onCheckedChange={(checked) => setModoTeste(checked)}
          />
          <Label htmlFor="modo-teste" className="cursor-pointer">
            Modo Teste (sem pagamento real)
          </Label>
        </div>
      </div>

      {modoTeste && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Package className="h-5 w-5" />
              <p className="font-medium">
                Modo Teste Ativado: As assinaturas serão criadas sem pagamento real. 
                Use apenas para testes!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {planos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhum plano disponível</h3>
              <p className="text-muted-foreground mb-6">
                {barbeariaSelecionada
                  ? "Esta barbearia não possui planos disponíveis no momento."
                  : "Você precisa ter agendamentos em uma barbearia para ver os planos disponíveis."}
              </p>
              {!barbeariaSelecionada && (
                <Button onClick={() => navigate("/cliente/agendar")}>
                  Fazer meu primeiro agendamento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.values(planosPorBarbearia).map((grupo) => (
            <div key={grupo.barbearia.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-semibold">{grupo.barbearia.nome}</h3>
                <Badge variant="outline">{grupo.planos.length} plano(s)</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grupo.planos.map((plano) => (
                  <Card key={plano.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl">{plano.nome}</CardTitle>
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <CardDescription>{plano.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-4xl font-bold">
                            {formatarMoeda(plano.valor)}
                          </span>
                          <span className="text-muted-foreground">
                            /{plano.duracaoMeses} {plano.duracaoMeses === 1 ? "mês" : "meses"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          {formatarMoeda(plano.valor / plano.duracaoMeses)} por mês
                        </div>
                      </div>

                      {plano.beneficios && plano.beneficios.length > 0 && (
                        <div className="mb-6 flex-1">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Benefícios
                          </h4>
                          <ul className="space-y-2">
                            {plano.beneficios.map((beneficio, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{beneficio}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => handleComprar(plano)}
                        disabled={comprando === plano.id}
                      >
                        {comprando === plano.id ? (
                          <>
                            <CreditCard className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Assinar Agora
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

