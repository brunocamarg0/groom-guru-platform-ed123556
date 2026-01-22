import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft } from "lucide-react";

export default function PagamentoPendente() {
  const [searchParams] = useSearchParams();
  const agendamentoId = searchParams.get("agendamento");

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento Pendente</CardTitle>
          <CardDescription>
            Seu pagamento está sendo processado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Estamos aguardando a confirmação do seu pagamento. Você receberá um e-mail assim que o pagamento for confirmado.
          </p>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link to="/cliente">Ver Meus Agendamentos</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/cliente/agendar">
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

