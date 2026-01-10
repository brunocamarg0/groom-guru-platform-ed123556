import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowLeft, RefreshCw } from "lucide-react";

export default function PagamentoPendente() {
  const [searchParams] = useSearchParams();
  const agendamentoId = searchParams.get("agendamento");
  const paymentId = searchParams.get("payment_id");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Pendente</CardTitle>
          <CardDescription>
            Seu pagamento está sendo processado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              O pagamento pode estar pendente por alguns motivos:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Pagamento em processamento (boleto, transferência)</li>
              <li>Aguardando confirmação do banco</li>
              <li>PIX aguardando pagamento</li>
            </ul>
          </div>

          {paymentId && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">ID do Pagamento</p>
              <p className="text-sm font-mono">{paymentId}</p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Você receberá uma notificação quando o pagamento for confirmado.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/client">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            {agendamentoId && (
              <Button className="flex-1" asChild>
                <Link to={`/client/agendamentos/${agendamentoId}`}>
                  Ver Agendamento
                  <RefreshCw className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

