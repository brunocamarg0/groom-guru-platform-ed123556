import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PagamentoFalha() {
  const [searchParams] = useSearchParams();
  const agendamentoId = searchParams.get("agendamento");
  const status = searchParams.get("status");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Não Aprovado</CardTitle>
          <CardDescription>
            Não foi possível processar seu pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Possíveis motivos:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Dados do cartão incorretos</li>
              <li>Saldo insuficiente</li>
              <li>Cartão bloqueado</li>
              <li>Limite excedido</li>
            </ul>
          </div>

          {agendamentoId && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/client">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link to={`/client/checkout/${agendamentoId}`}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Link>
              </Button>
            </div>
          )}

          {!agendamentoId && (
            <Button className="w-full" asChild>
              <Link to="/client">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Dashboard
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

