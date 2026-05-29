import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, MessageSquare, HelpCircle, Send, Phone, Mail, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const faqs = [
  {
    pergunta: "Como cancelar um agendamento?",
    resposta:
      "Você pode cancelar um agendamento até 2 horas antes do horário marcado. Acesse seu histórico de agendamentos, clique no agendamento que deseja cancelar e selecione 'Cancelar'. Se precisar cancelar com menos de 2 horas de antecedência, entre em contato diretamente com a barbearia.",
  },
  {
    pergunta: "Posso reagendar um serviço?",
    resposta:
      "Sim! Você pode reagendar a qualquer momento através do botão 'Reagendar' no seu agendamento. O reagendamento está sujeito à disponibilidade de horários.",
  },
  {
    pergunta: "Como funciona o programa de fidelidade?",
    resposta:
      "A cada corte realizado e avaliado, você ganha pontos. A cada 5 cortes, você ganha descontos exclusivos! Os pontos nunca expiram e você pode acompanhar seu saldo na aba 'Fidelidade'.",
  },
  {
    pergunta: "Quais formas de pagamento são aceitas?",
    resposta:
      "Aceitamos PIX (pagamento instantâneo), cartão de crédito, cartão de débito e dinheiro. Você também pode usar seus créditos acumulados como desconto no pagamento.",
  },
  {
    pergunta: "Como usar meus créditos?",
    resposta:
      "Seus créditos são aplicados automaticamente no momento do pagamento. Você pode escolher usar todo o saldo ou apenas parte dele. Os créditos podem ser obtidos através de promoções ou reembolsos.",
  },
  {
    pergunta: "Posso avaliar um serviço?",
    resposta:
      "Sim! Após a conclusão de cada serviço, você pode avaliar o atendimento. Sua avaliação ajuda outras pessoas e ainda rende pontos de fidelidade para você!",
  },
  {
    pergunta: "O que acontece se eu chegar atrasado?",
    resposta:
      "Se você chegar atrasado, o tempo de serviço pode ser reduzido para não afetar os próximos clientes. Em atrasos maiores que 15 minutos, o agendamento pode ser cancelado. Recomendamos chegar 5 minutos antes do horário marcado.",
  },
  {
    pergunta: "Como alterar meus dados cadastrais?",
    resposta:
      "Acesse a aba 'Perfil' no menu para atualizar seus dados como nome, telefone e email. Para alterar a senha, vá em 'Configurações' e clique em 'Alterar Senha'.",
  },
];

const categoriasSuporte = [
  { value: "agendamento", label: "Problemas com agendamento" },
  { value: "pagamento", label: "Dúvidas sobre pagamento" },
  { value: "fidelidade", label: "Programa de fidelidade" },
  { value: "conta", label: "Minha conta" },
  { value: "outro", label: "Outro assunto" },
];

export default function SuporteCliente() {
  const { cliente } = useCliente();
  const { toast } = useToast();
  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Fallback: em alguns cenários o contexto pode demorar a carregar,
  // mas o login já salvou o usuário em localStorage.
  const clienteFallback = (() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const u = JSON.parse(userStr);
      return {
        id: typeof u?.id === "string" ? u.id : undefined,
        nome: typeof u?.nome === "string" ? u.nome : undefined,
        email: typeof u?.email === "string" ? u.email : undefined,
      };
    } catch {
      return null;
    }
  })();

  const handleEnviarMensagem = async () => {
    if (!categoria) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria.",
        variant: "destructive",
      });
      return;
    }

    if (!mensagem.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem.",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    try {
      const clienteNomeEfetivo = cliente?.nome || clienteFallback?.nome || "Cliente não identificado";
      const clienteEmailEfetivo = cliente?.email || clienteFallback?.email || "";
      const clienteIdEfetivo = cliente?.id || clienteFallback?.id;

      const dadosTicket = {
        categoria,
        assunto: assunto || categoriasSuporte.find(c => c.value === categoria)?.label,
        mensagem,
        clienteNome: clienteNomeEfetivo,
        clienteEmail: clienteEmailEfetivo,
        ...(clienteIdEfetivo && { clienteId: clienteIdEfetivo }),
      };

      if (!dadosTicket.clienteEmail) {
        toast({
          title: "Erro",
          description: "Não consegui identificar seu email para abrir o ticket. Faça login novamente.",
          variant: "destructive",
        });
        setEnviando(false);
        return;
      }

      const { error } = await supabase.from("tickets_suporte").insert({
        categoria: dadosTicket.categoria,
        assunto: dadosTicket.assunto ?? "Sem assunto",
        mensagem: dadosTicket.mensagem,
        cliente_nome: dadosTicket.clienteNome,
        cliente_email: dadosTicket.clienteEmail,
        cliente_id: dadosTicket.clienteId ?? null,
      });
      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Nossa equipe entrará em contato em até 24 horas.",
      });

      setEnviado(true);
      setCategoria("");
      setAssunto("");
      setMensagem("");

      // Reset após 5 segundos
      setTimeout(() => {
        setEnviado(false);
      }, 5000);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleWhatsApp = () => {
    const numero = "5519989482441";
    const texto = encodeURIComponent("Olá! Preciso de ajuda com o aplicativo de agendamento.");
    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
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
        <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={handleWhatsApp}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              WhatsApp
            </CardTitle>
            <CardDescription>
              Atendimento rápido pelo WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span>Seg-Sex: 9h às 18h | Sáb: 9h às 13h</span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contato
            </CardTitle>
            <CardDescription>
              Outras formas de entrar em contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>brunocamargocontato@hotmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>(19) 98948-2441</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Enviar Mensagem
          </CardTitle>
          <CardDescription>
            Descreva seu problema ou dúvida
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mensagem Enviada!</h3>
              <p className="text-muted-foreground">
                Nossa equipe entrará em contato em breve.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasSuporte.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assunto (opcional)</Label>
                <Input
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Resumo do seu problema"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Descreva sua dúvida ou problema com o máximo de detalhes possível..."
                  rows={4}
                />
              </div>
              <Button className="w-full" onClick={handleEnviarMensagem} disabled={enviando}>
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.pergunta}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.resposta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
