import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function PagamentoAssinaturaSucesso() {
  const [searchParams] = useSearchParams();
  const plano = searchParams.get("plano") || "plano";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-md mx-auto py-16 px-4">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
              Pagamento recebido
            </CardTitle>
            <CardDescription>
              Sua assinatura do plano <strong>{plano}</strong> foi confirmada. Em breve você receberá um email com os próximos passos para ativar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
