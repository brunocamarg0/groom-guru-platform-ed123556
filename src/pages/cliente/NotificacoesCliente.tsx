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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR");
  };

  const tipoConfig = {
    agendamento: { label: "Agendamento", icon: Calendar, variant: "default" as const },
    lembrete: { label: "Lembrete", icon: Bell, variant: "secondary" as const },
    promocao: { label: "Promoção", icon: Gift, variant: "outline" as const },
    pagamento: { label: "Pagamento", icon: CreditCard, variant: "default" as const },
    sistema: { label: "Sistema", icon: Settings, variant: "secondary" as const },
  };

  const canalConfig = {
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
            {notificacoes.filter((n) => !n.lida).length} não lidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificacoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma notificação
              </p>
            ) : (
              notificacoes.map((notificacao) => {
                const tipo = tipoConfig[notificacao.tipo] || tipoConfig.sistema;
                const TipoIcon = tipo.icon;
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
                        <h4 className="font-medium">{notificacao.titulo}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notificacao.mensagem}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {notificacao.canal && (
                            <Badge variant="outline" className="text-xs">
                              {canalConfig[notificacao.canal].label}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatarData(notificacao.data)}
                          </span>
                        </div>
                      </div>
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => marcarNotificacaoLida(notificacao.id)}
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

