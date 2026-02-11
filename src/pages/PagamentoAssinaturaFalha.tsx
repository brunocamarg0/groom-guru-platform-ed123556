import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PagamentoAssinaturaFalha() {
  const [searchParams] = useSearchParams();
  const plano = searchParams.get("plano") || "plano";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Pagamento não concluído
            </CardTitle>
            <CardDescription>
              O pagamento da assinatura do plano <strong>{plano}</strong> não foi aprovado. Você pode tentar novamente quando quiser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">Voltar ao início</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to={`/checkout-assinatura?plano=${plano}`}>Tentar novamente</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
