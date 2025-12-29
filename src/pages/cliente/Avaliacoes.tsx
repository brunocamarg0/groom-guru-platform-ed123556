import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Avaliacoes() {
  const { agendamentos, criarAvaliacao } = useCliente();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const agendamentoId = searchParams.get("agendamento");

  const agendamento = agendamentoId
    ? agendamentos.find((a) => a.id === agendamentoId)
    : undefined;

  const [notas, setNotas] = useState({
    profissional: 0,
    atendimento: 0,
    ambiente: 0,
  });
  const [comentario, setComentario] = useState("");

  const handleSubmit = () => {
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

    criarAvaliacao({
      agendamentoId,
      profissionalId: agendamento.profissionalId,
      notaProfissional: notas.profissional,
      notaAtendimento: notas.atendimento,
      notaAmbiente: notas.ambiente,
      comentario: comentario || undefined,
    });

    toast({
      title: "Avaliação enviada!",
      description: "Obrigado pelo seu feedback.",
    });

    navigate("/cliente/historico");
  };

  const renderStars = (tipo: "profissional" | "atendimento" | "ambiente") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 cursor-pointer transition-colors ${
              notas[tipo] >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
            onClick={() => setNotas({ ...notas, [tipo]: star })}
          />
        ))}
      </div>
    );
  };

  if (!agendamento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Agendamento não encontrado</p>
          <Button onClick={() => navigate("/cliente/historico")} className="mt-4">
            Voltar ao Histórico
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Avaliar Atendimento</h2>
        <p className="text-muted-foreground">
          Compartilhe sua experiência conosco
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Serviço:</span> {agendamento.servicoNome}
            </p>
            <p>
              <span className="font-medium">Profissional:</span> {agendamento.profissionalNome}
            </p>
            <p>
              <span className="font-medium">Data:</span>{" "}
              {new Date(agendamento.data).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avaliação</CardTitle>
          <CardDescription>
            Avalie sua experiência em cada aspecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Profissional</Label>
            {renderStars("profissional")}
          </div>

          <div className="space-y-2">
            <Label>Atendimento</Label>
            {renderStars("atendimento")}
          </div>

          <div className="space-y-2">
            <Label>Ambiente</Label>
            {renderStars("ambiente")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Deixe seu comentário sobre o atendimento..."
              rows={4}
            />
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Enviar Avaliação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

