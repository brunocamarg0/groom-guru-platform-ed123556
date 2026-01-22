import { useCliente } from "@/context/ClienteContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, CheckCircle, Calendar, Gift, CreditCard, Settings } from "lucide-react";

export default function NotificacoesCliente() {
  const { notificacoes, marcarNotificacaoLida } = useCliente();

  // Proteção contra undefined
  const notificacoesArray = Array.isArray(notificacoes) ? notificacoes : [];

  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

  const tipoConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "outline" }> = {
    agendamento: { label: "Agendamento", icon: Calendar, variant: "default" },
    lembrete: { label: "Lembrete", icon: Bell, variant: "secondary" },
    promocao: { label: "Promoção", icon: Gift, variant: "outline" },
    pagamento: { label: "Pagamento", icon: CreditCard, variant: "default" },
    sistema: { label: "Sistema", icon: Settings, variant: "secondary" },
  };

  const canalConfig: Record<string, { label: string; icon: any }> = {
    app: { label: "App", icon: Bell },
    email: { label: "Email", icon: Mail },
    whatsapp: { label: "WhatsApp", icon: MessageSquare },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notificações</h2>
        <p className="text-muted-foreground">
          Gerencie suas notificações e preferências
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas Notificações</CardTitle>
          <CardDescription>
            {notificacoesArray.filter((n) => !n.lida).length} não lidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificacoesArray.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma notificação
              </p>
            ) : (
              notificacoesArray.map((notificacao) => {
                const notificacaoComTipo = notificacao as { id: string; titulo: string; mensagem: string; lida: boolean; data: string; tipo?: string; canal?: string };
                const tipoKey = notificacaoComTipo.tipo || "sistema";
                const tipo = tipoConfig[tipoKey] || tipoConfig.sistema;
                const TipoIcon = tipo.icon;
                const canalKey = notificacaoComTipo.canal || "app";
                const canal = canalConfig[canalKey] || canalConfig.app;
                return (
                  <div
                    key={notificacao.id}
                    className={`p-4 border rounded-lg ${
                      !notificacao.lida ? "bg-primary/5 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TipoIcon className="h-4 w-4" />
                          <Badge variant={tipo.variant}>{tipo.label}</Badge>
                          {!notificacao.lida && (
                            <Badge variant="destructive" className="text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium">{notificacao.titulo || "Sem título"}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notificacao.mensagem || "Sem mensagem"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {notificacaoComTipo.canal && (
                            <Badge variant="outline" className="text-xs">
                              {canal.label}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatarData(notificacao.data || new Date().toISOString())}
                          </span>
                        </div>
                      </div>
                      {!notificacao.lida && marcarNotificacaoLida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (marcarNotificacaoLida) {
                              await marcarNotificacaoLida(notificacao.id);
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

