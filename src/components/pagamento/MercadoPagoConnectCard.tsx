import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  barbeariaId: string | null;
}

interface MPStatus {
  connected: boolean;
  mp_user_id: string | null;
  public_key: string | null;
  connected_at: string | null;
}

export default function MercadoPagoConnectCard({ barbeariaId }: Props) {
  const [status, setStatus] = useState<MPStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();

  const carregar = async () => {
    if (!barbeariaId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_mp_connection_status", {
      _barbearia_id: barbeariaId,
    });
    if (error) {
      console.error(error);
    } else if (data && data.length > 0) {
      setStatus(data[0] as MPStatus);
    } else {
      setStatus({ connected: false, mp_user_id: null, public_key: null, connected_at: null });
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeariaId]);

  // Processa retorno do OAuth
  useEffect(() => {
    const mp = params.get("mp");
    if (mp === "ok") {
      toast({ title: "Mercado Pago conectado!", description: "Sua conta foi vinculada com sucesso." });
      params.delete("mp");
      setParams(params, { replace: true });
      carregar();
    } else if (mp === "erro") {
      toast({
        title: "Falha ao conectar Mercado Pago",
        description: params.get("motivo") || "Tente novamente.",
        variant: "destructive",
      });
      params.delete("mp");
      params.delete("motivo");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const conectar = async () => {
    if (!barbeariaId) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("mercadopago-oauth-start", {
      body: { barbeariaId },
    });
    setBusy(false);
    if (error || !data?.url) {
      toast({
        title: "Erro ao iniciar conexão",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = data.url;
  };

  const desconectar = async () => {
    if (!barbeariaId) return;
    if (!confirm("Desconectar sua conta Mercado Pago? Pagamentos online ficarão indisponíveis até reconectar.")) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke("mercadopago-disconnect", {
      body: { barbeariaId },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Erro ao desconectar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Conta desconectada" });
    carregar();
  };

  return (
    <Card className="rounded-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pagamentos Online — Mercado Pago
          {status?.connected && (
            <Badge variant="default" className="rounded-sm">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Conecte sua conta do Mercado Pago para receber pagamentos online dos clientes
          <strong> direto na sua conta</strong>. Cada barbearia tem sua própria conexão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : status?.connected ? (
          <>
            <div className="text-sm space-y-1">
              <p><strong>ID da conta MP:</strong> {status.mp_user_id}</p>
              {status.connected_at && (
                <p className="text-muted-foreground">
                  Conectada em {new Date(status.connected_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <Button variant="destructive" onClick={desconectar} disabled={busy} className="rounded-sm">
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Desconectar conta
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2 p-3 rounded-sm bg-muted/50 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>
                Enquanto não conectar, o pagamento online ficará desabilitado para seus clientes —
                eles só poderão pagar presencialmente.
              </span>
            </div>
            <Button onClick={conectar} disabled={busy || !barbeariaId} className="rounded-sm">
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Conectar Mercado Pago
            </Button>
            <p className="text-xs text-muted-foreground">
              Você será redirecionado para o Mercado Pago para autorizar a conexão.
              Não precisa compartilhar senha nem token conosco.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
