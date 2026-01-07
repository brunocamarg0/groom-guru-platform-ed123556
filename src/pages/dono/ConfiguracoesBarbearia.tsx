import { useState } from "react";
import { useDono } from "@/context/DonoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ConfiguracoesBarbearia() {
  const { configuracao, atualizarConfiguracao } = useDono();
  const { toast } = useToast();
  const [formData, setFormData] = useState(configuracao);

  const handleSubmit = () => {
    atualizarConfiguracao(formData);
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações da Barbearia</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua barbearia
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Barbearia</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ/CPF</Label>
            <Input
              id="cnpj"
              value={formData.cnpjCpf}
              onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(formData.horarioFuncionamento).map(([dia, horario]) => (
            <div key={dia} className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Label className="w-24 capitalize">{dia}</Label>
                <Switch
                  checked={horario.aberto}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      horarioFuncionamento: {
                        ...formData.horarioFuncionamento,
                        [dia]: { ...horario, aberto: checked },
                      },
                    })
                  }
                />
                {horario.aberto && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={horario.inicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          horarioFuncionamento: {
                            ...formData.horarioFuncionamento,
                            [dia]: { ...horario, inicio: e.target.value },
                          },
                        })
                      }
                      className="w-32"
                    />
                    <span>até</span>
                    <Input
                      type="time"
                      value={horario.fim}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          horarioFuncionamento: {
                            ...formData.horarioFuncionamento,
                            [dia]: { ...horario, fim: e.target.value },
                          },
                        })
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política de Cancelamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prazoMinimo">Prazo Mínimo (horas antes)</Label>
            <Input
              id="prazoMinimo"
              type="number"
              value={formData.politicaCancelamento.prazoMinimo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  politicaCancelamento: {
                    ...formData.politicaCancelamento,
                    prazoMinimo: parseInt(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="permitirReagendamento">Permitir Reagendamento</Label>
            <Switch
              id="permitirReagendamento"
              checked={formData.politicaCancelamento.permitirReagendamento}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  politicaCancelamento: {
                    ...formData.politicaCancelamento,
                    permitirReagendamento: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link de Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>URL Pública</Label>
            <Input value={formData.linkAgendamento} readOnly />
            <p className="text-xs text-muted-foreground">
              Este é o link que seus clientes usarão para agendar
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>Salvar Configurações</Button>
      </div>
    </div>
  );
}



