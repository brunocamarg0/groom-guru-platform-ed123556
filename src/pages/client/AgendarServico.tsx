import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCliente } from "@/context/ClienteContext";
import { useBarbearias } from "@/context/BarbeariasContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Servico, NovoAgendamento } from "@/types/cliente";
import { format } from "date-fns";

export default function AgendarServico() {
  const navigate = useNavigate();
  const { criarAgendamento, getServicosPorBarbearia } = useCliente();
  const { barbearias } = useBarbearias();
  const { toast } = useToast();

  const [barbeariaId, setBarbeariaId] = useState<string>("");
  const [servicoId, setServicoId] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [hora, setHora] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Horários disponíveis
  const horarios = Array.from({ length: 17 }, (_, i) => {
    const hour = 8 + i; // Das 8h às 00h
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  // Data mínima (hoje)
  const dataMinima = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (barbeariaId) {
      const servicosDisponiveis = getServicosPorBarbearia(barbeariaId);
      setServicos(servicosDisponiveis);
      setServicoId(""); // Reset servico ao trocar barbearia
    } else {
      setServicos([]);
    }
  }, [barbeariaId, getServicosPorBarbearia]);

  const servicoSelecionado = servicos.find((s) => s.id === servicoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!barbeariaId || !servicoId || !data || !hora) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const novoAgendamento: NovoAgendamento = {
        barbeariaId,
        servicoId,
        data,
        hora,
        observacoes: observacoes || undefined,
      };

      const agendamento = criarAgendamento(novoAgendamento);

      toast({
        title: "Agendamento criado",
        description: "Redirecionando para o pagamento...",
      });

      // Redirecionar para checkout
      setTimeout(() => {
        navigate(`/client/checkout/${agendamento.id}`);
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro ao criar agendamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/client">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-black uppercase">Novo Agendamento</h2>
          <p className="text-muted-foreground mt-1">
            Preencha os dados para agendar seu serviço
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Agendamento</CardTitle>
          <CardDescription>
            Selecione a barbearia, serviço, data e horário desejados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="barbearia">Barbearia *</Label>
              <Select
                value={barbeariaId}
                onValueChange={setBarbeariaId}
                required
              >
                <SelectTrigger id="barbearia">
                  <SelectValue placeholder="Selecione uma barbearia" />
                </SelectTrigger>
                <SelectContent>
                  {barbearias
                    .filter((b) => b.status === "ativa")
                    .map((barbearia) => (
                      <SelectItem key={barbearia.id} value={barbearia.id}>
                        {barbearia.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço *</Label>
              <Select
                value={servicoId}
                onValueChange={setServicoId}
                required
                disabled={!barbeariaId || servicos.length === 0}
              >
                <SelectTrigger id="servico">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id}>
                      {servico.nome} - R$ {servico.preco.toFixed(2).replace(".", ",")} (
                      {servico.duracao} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {servicoSelecionado && (
                <p className="text-sm text-muted-foreground">
                  {servicoSelecionado.descricao}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  min={dataMinima}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Select value={hora} onValueChange={setHora} required>
                  <SelectTrigger id="hora">
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {horarios.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Alguma observação ou preferência especial?"
                rows={3}
              />
            </div>

            {servicoSelecionado && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total a pagar:</span>
                  <span className="text-2xl font-black text-primary">
                    R$ {servicoSelecionado.preco.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/client")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="hero"
                disabled={isLoading || !servicoSelecionado}
                className="flex-1"
              >
                {isLoading ? "Processando..." : "Continuar para Pagamento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

