import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, MessageSquare, HelpCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const faqs = [
  {
    pergunta: "Como cancelar um agendamento?",
    resposta:
      "Você pode cancelar um agendamento até 2 horas antes do horário marcado. Acesse o agendamento e clique em 'Cancelar'.",
  },
  {
    pergunta: "Posso reagendar um serviço?",
    resposta:
      "Sim! Você pode reagendar a qualquer momento através do botão 'Reagendar' no seu agendamento.",
  },
  {
    pergunta: "Como funciona o programa de fidelidade?",
    resposta:
      "A cada corte realizado e avaliado, você ganha pontos. A cada 5 cortes, você ganha descontos exclusivos!",
  },
  {
    pergunta: "Quais formas de pagamento são aceitas?",
    resposta:
      "Aceitamos PIX, cartão de crédito e você também pode usar seus créditos acumulados.",
  },
];

export default function SuporteCliente() {
  const { toast } = useToast();
  const [mensagem, setMensagem] = useState("");

  const handleEnviarMensagem = () => {
    if (!mensagem.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mensagem enviada",
      description: "Nossa equipe entrará em contato em breve.",
    });
    setMensagem("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Suporte & Contato</h2>
        <p className="text-muted-foreground">
          Entre em contato conosco ou consulte as perguntas frequentes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Fale conosco diretamente pelo WhatsApp
            </p>
            <Button className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Envie sua mensagem</Label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua dúvida ou problema..."
                rows={3}
              />
            </div>
            <Button className="w-full" onClick={handleEnviarMensagem}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Mensagem
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Perguntas Frequentes (FAQ)
          </CardTitle>
          <CardDescription>
            Encontre respostas para as dúvidas mais comuns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{faq.pergunta}</h4>
                <p className="text-sm text-muted-foreground">{faq.resposta}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



