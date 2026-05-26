import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Store, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SelecaoFormaPagamentoProps {
  agendamentoId: string;
  valor: number;
  onPagamentoPresencial: () => void;
}

export function SelecaoFormaPagamento({
  agendamentoId,
  valor,
  onPagamentoPresencial,
}: SelecaoFormaPagamentoProps) {
  const [formaPagamento, setFormaPagamento] = useState<"online" | "presencial">("online");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatarMoeda = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleContinuar = async () => {
    setLoading(true);
    try {
      if (formaPagamento === "presencial") {
        const { error: pagErr } = await supabase.from("pagamentos").insert({
          agendamento_id: agendamentoId,
          valor,
          metodo: "dinheiro",
          status: "pendente",
        });
        if (pagErr) throw pagErr;

        await supabase
          .from("agendamentos")
          .update({ forma_pagamento: "presencial" })
          .eq("id", agendamentoId);

        toast({
          title: "Agendamento confirmado!",
          description: "Você pagará na barbearia no dia do atendimento.",
        });
        onPagamentoPresencial();
        setTimeout(() => navigate("/cliente"), 1500);
        return;
      }

      const { data, error } = await supabase.functions.invoke("mercadopago-preference", {
        body: { agendamentoId },
      });

      // Tenta extrair mensagem detalhada do corpo da resposta (ex.: 409 mp_nao_conectado)
      if (error) {
        let detalhe: string | null = null;
        try {
          const ctx: any = (error as any).context;
          if (ctx?.json) {
            const body = await ctx.json();
            detalhe = body?.message || body?.error || null;
          } else if (ctx?.text) {
            const txt = await ctx.text();
            try {
              const body = JSON.parse(txt);
              detalhe = body?.message || body?.error || null;
            } catch {
              detalhe = txt;
            }
          }
        } catch {
          /* ignore */
        }
        throw new Error(detalhe || error.message || "Erro ao iniciar pagamento online");
      }

      const url = data?.initPoint || data?.sandboxInitPoint;
      if (!url) throw new Error("URL de pagamento indisponível");
      window.location.href = url;
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e.message || "Não foi possível processar o pagamento.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escolha a Forma de Pagamento</CardTitle>
        <CardDescription>Selecione como deseja pagar pelo seu agendamento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={formaPagamento}
          onValueChange={(v) => setFormaPagamento(v as "online" | "presencial")}
        >
          <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
            <RadioGroupItem value="online" id="online" />
            <Label htmlFor="online" className="flex-1 cursor-pointer flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Pagamento Online</p>
                <p className="text-sm text-muted-foreground">
                  Pague agora com cartão ou PIX
                </p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
            <RadioGroupItem value="presencial" id="presencial" />
            <Label htmlFor="presencial" className="flex-1 cursor-pointer flex items-center gap-3">
              <Store className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Pagamento na Barbearia</p>
                <p className="text-sm text-muted-foreground">
                  Pague quando chegar no dia do atendimento
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-2xl font-bold">{formatarMoeda(valor)}</span>
        </div>

        <Button className="w-full" onClick={handleContinuar} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : formaPagamento === "online" ? (
            "Pagar Agora"
          ) : (
            "Confirmar Agendamento"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
