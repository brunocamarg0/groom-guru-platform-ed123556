import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Store, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const handleContinuar = async () => {
    if (formaPagamento === "presencial") {
      // Criar pagamento presencial
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/pagamentos/presencial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ agendamentoId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar pagamento presencial');
        }

        const data = await response.json();
        
        toast({
          title: "Agendamento confirmado!",
          description: "Você pagará na barbearia no dia do atendimento.",
        });

        onPagamentoPresencial();
        
        // Redirecionar para dashboard após 1.5s
        setTimeout(() => {
          navigate("/cliente");
        }, 1500);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível confirmar o pagamento presencial.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Criar preferência de pagamento no Mercado Pago
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://groom-guru-platform-production.up.railway.app/api';
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/pagamentos/preferencia`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ agendamentoId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar preferência de pagamento');
        }

        const data = await response.json();
        
        // Redirecionar para o checkout do Mercado Pago
        if (data.initPoint) {
          window.location.href = data.initPoint;
        } else if (data.sandboxInitPoint) {
          // Em desenvolvimento, usar sandbox
          window.location.href = data.sandboxInitPoint;
        } else {
          throw new Error('URL de pagamento não disponível');
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível iniciar o pagamento.",
          variant: "destructive",
        });
        setLoading(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escolha a Forma de Pagamento</CardTitle>
        <CardDescription>
          Selecione como deseja pagar pelo seu agendamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <RadioGroup
            value={formaPagamento}
            onValueChange={(value) => setFormaPagamento(value as "online" | "presencial")}
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="online" id="online" />
              <Label htmlFor="online" className="flex-1 cursor-pointer flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Pagamento Online</p>
                  <p className="text-sm text-muted-foreground">
                    Pague agora com cartão de crédito, débito ou PIX
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
                    Pague quando chegar na barbearia no dia do atendimento
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-2xl font-bold">{formatarMoeda(valor)}</span>
        </div>

        <Button
          className="w-full"
          onClick={handleContinuar}
          disabled={loading}
        >
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

