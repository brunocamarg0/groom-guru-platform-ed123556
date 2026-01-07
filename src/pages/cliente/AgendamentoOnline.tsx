import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Scissors, User, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TipoServico, NovoAgendamento } from "@/types/cliente";
import { useNavigate } from "react-router-dom";

// Mock de dados
const profissionais = [
  { id: "1", nome: "Carlos Barbeiro", especialidades: ["Corte", "Barba"], disponivel: true },
  { id: "2", nome: "João Silva", especialidades: ["Corte"], disponivel: true },
  { id: "3", nome: "Pedro Santos", especialidades: ["Barba", "Combo"], disponivel: false },
];

const horariosDisponiveis = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

export default function AgendamentoOnline() {
  const { criarAgendamento } = useCliente();
  const { getBarbearia } = useBarbearias();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<NovoAgendamento>>({
    barbeariaId: "1",
    profissionalId: "",
    servico: undefined,
    data: "",
    horario: "",
  });

  // Buscar serviços da barbearia selecionada (apenas os ativos)
  const barbearia = formData.barbeariaId ? getBarbearia(formData.barbeariaId) : undefined;
  const servicosDisponiveis = barbearia?.servicos?.filter((s) => s.ativo) || [];
  
  const servicoSelecionado = servicosDisponiveis.find((s) => s.tipo === formData.servico);
  const profissionalSelecionado = profissionais.find((p) => p.id === formData.profissionalId);

  const handleSubmit = () => {
    if (!formData.profissionalId || !formData.servico || !formData.data || !formData.horario) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    criarAgendamento(formData as NovoAgendamento);
    toast({
      title: "Agendamento criado!",
      description: "Seu agendamento foi criado com sucesso.",
    });
    navigate("/cliente");
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Agendar Serviço</h2>
        <p className="text-muted-foreground">
          Escolha o serviço, profissional, data e horário
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Escolher Serviço */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>1. Escolha o Serviço</CardTitle>
            <CardDescription>Selecione o serviço desejado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {servicosDisponiveis.map((servico) => (
              <div
                key={servico.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.servico === servico.tipo
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent"
                }`}
                onClick={() => setFormData({ ...formData, servico: servico.tipo as TipoServico })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scissors className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{servico.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {servico.duracao} minutos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatarMoeda(servico.valor)}</p>
                  </div>
                </div>
              </div>
            ))}
            <Button
              className="w-full mt-4"
              onClick={() => setStep(2)}
              disabled={!formData.servico}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Escolher Profissional */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Escolha o Profissional</CardTitle>
            <CardDescription>Selecione o barbeiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profissionais
              .filter((p) => p.disponivel)
              .map((profissional) => (
                <div
                  key={profissional.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.profissionalId === profissional.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setFormData({ ...formData, profissionalId: profissional.id })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{profissional.nome}</p>
                        <div className="flex gap-2 mt-1">
                          {profissional.especialidades.map((esp) => (
                            <Badge key={esp} variant="secondary" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(3)}
                disabled={!formData.profissionalId}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Escolher Data e Horário */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Escolha Data e Horário</CardTitle>
            <CardDescription>Selecione quando deseja ser atendido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <div className="grid grid-cols-4 gap-2">
                {horariosDisponiveis.map((horario) => (
                  <Button
                    key={horario}
                    variant={formData.horario === horario ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, horario })}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {horario}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(4)}
                disabled={!formData.data || !formData.horario}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmação */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>4. Confirmação</CardTitle>
            <CardDescription>Revise os dados do seu agendamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium">{servicoSelecionado?.nome}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Profissional:</span>
                <span className="font-medium">{profissionalSelecionado?.nome}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">
                  {formData.data &&
                    new Date(formData.data).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium">{formData.horario}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">{servicoSelecionado?.duracao} minutos</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg font-bold text-lg">
                <span>Total:</span>
                <span>{formatarMoeda(servicoSelecionado?.valor || 0)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Confirmar Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

