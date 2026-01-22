import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

export default function PagamentoFalha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const agendamentoId = searchParams.get("agendamento");

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento Não Aprovado</CardTitle>
          <CardDescription>
            Não foi possível processar seu pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            O pagamento não foi aprovado. Verifique os dados do cartão ou tente novamente.
          </p>
          <div className="flex gap-2">
            {agendamentoId && (
              <Button asChild className="flex-1">
                <Link to={`/cliente/pagamento?agendamento=${agendamentoId}`}>
                  Tentar Novamente
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild className="flex-1">
              <Link to="/cliente">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

