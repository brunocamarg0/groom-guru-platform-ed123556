import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCliente } from "@/context/ClienteContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, Calendar, User, Scissors, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export default function Avaliacoes() {
  const { agendamentos, carregarDados, loading, cliente } = useCliente();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const agendamentoId = searchParams.get("agendamento");

  // Carregar dados se ainda não foram carregados
  useEffect(() => {
    if (!cliente && !loading && carregarDados) {
      console.log('🔄 [AVALIACOES] Cliente não encontrado, carregando dados...');
      carregarDados();
    }
  }, [cliente, loading, carregarDados]);

  // Proteção contra undefined
  const agendamentosArray = Array.isArray(agendamentos) ? agendamentos : [];
  const agendamento = agendamentoId
    ? agendamentosArray.find((a) => a.id === agendamentoId)
    : undefined;

  const [notas, setNotas] = useState({
    profissional: 0,
    atendimento: 0,
    ambiente: 0,
  });
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async () => {
    if (!agendamento || !agendamentoId) {
      toast({
        title: "Erro",
        description: "Agendamento não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (notas.profissional === 0 || notas.atendimento === 0 || notas.ambiente === 0) {
      toast({
        title: "Erro",
        description: "Por favor, avalie todos os itens.",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    try {
      if (!cliente?.id) throw new Error("Cliente não identificado");
      const { error } = await supabase.from("avaliacoes").insert({
        agendamento_id: agendamentoId,
        cliente_id: cliente.id,
        nota_profissional: notas.profissional,
        nota_atendimento: notas.atendimento,
        nota_ambiente: notas.ambiente,
        comentario: comentario || null,
      });
      if (error) throw error;


      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback. Você ganhou 10 pontos de fidelidade!",
      });

      setEnviado(true);

      // Recarregar dados
      if (carregarDados) {
        await carregarDados();
      }

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate("/cliente/historico");
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  const renderStars = (tipo: "profissional" | "atendimento" | "ambiente") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-8 w-8 cursor-pointer transition-all ${
              notas[tipo] >= star
                ? "fill-yellow-400 text-yellow-400 scale-110"
                : "text-muted-foreground hover:text-yellow-300"
            }`}
            onClick={() => setNotas({ ...notas, [tipo]: star })}
          />
        ))}
      </div>
    );
  };

  const calcularMediaNota = () => {
    const soma = notas.profissional + notas.atendimento + notas.ambiente;
    if (soma === 0) return 0;
    return (soma / 3).toFixed(1);
  };

  if (enviado) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground mb-4">
              Sua avaliação foi enviada com sucesso. Você ganhou 10 pontos de fidelidade!
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agendamento) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cliente/historico">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Avaliar Atendimento</h2>
            <p className="text-muted-foreground">
              Selecione um agendamento para avaliar
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agendamentos Disponíveis para Avaliação</CardTitle>
            <CardDescription>
              Clique em um agendamento concluído para avaliá-lo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agendamentosArray.filter(a => a.status === 'concluido').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Você ainda não tem agendamentos concluídos para avaliar.
              </p>
            ) : (
              <div className="space-y-2">
                {agendamentosArray
                  .filter(a => a.status === 'concluido')
                  .slice(0, 10)
                  .map((ag) => (
                    <div
                      key={ag.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/cliente/avaliacoes?agendamento=${ag.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Scissors className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{ag.servico?.nome || 'Serviço'}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(ag.data).toLocaleDateString('pt-BR')} às {ag.hora || ag.horario}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-2" />
                          Avaliar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const horario = agendamento.hora || agendamento.horario || '';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cliente/historico">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Avaliar Atendimento</h2>
          <p className="text-muted-foreground">
            Compartilhe sua experiência conosco
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium">{agendamento.servico?.nome || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Profissional</p>
                <p className="font-medium">{agendamento.profissionalNome || "A definir"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {agendamento.data ? new Date(agendamento.data).toLocaleDateString("pt-BR") : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-medium">{horario || "N/A"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sua Avaliação</CardTitle>
          <CardDescription>
            Avalie sua experiência em cada aspecto (1 a 5 estrelas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Profissional</Label>
            <p className="text-sm text-muted-foreground">
              Avalie a qualidade do serviço prestado
            </p>
            {renderStars("profissional")}
          </div>

          <div className="space-y-3">
            <Label className="text-base">Atendimento</Label>
            <p className="text-sm text-muted-foreground">
              Avalie a cordialidade e agilidade
            </p>
            {renderStars("atendimento")}
          </div>

          <div className="space-y-3">
            <Label className="text-base">Ambiente</Label>
            <p className="text-sm text-muted-foreground">
              Avalie a limpeza e conforto do local
            </p>
            {renderStars("ambiente")}
          </div>

          {(notas.profissional > 0 || notas.atendimento > 0 || notas.ambiente > 0) && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-center">
                <span className="text-sm text-muted-foreground">Nota média: </span>
                <span className="text-2xl font-bold text-primary">{calcularMediaNota()}</span>
                <span className="text-muted-foreground">/5</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Deixe seu comentário sobre o atendimento... O que você gostou? O que pode melhorar?"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Seu comentário ajuda a barbearia a melhorar os serviços
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={enviando || notas.profissional === 0 || notas.atendimento === 0 || notas.ambiente === 0}
          >
            {enviando ? (
              <>Enviando...</>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Enviar Avaliação
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
