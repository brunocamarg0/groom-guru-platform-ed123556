import { useState } from "react";
import { useDono } from "@/context/DonoContext";
import { useBarbearias } from "@/context/BarbeariasContext";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Power, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TipoServico } from "@/types/cliente";
import { NovoServicoBarbearia, ServicoBarbearia } from "@/types/barbearia";

const tiposServico: { value: TipoServico; label: string }[] = [
  { value: "corte", label: "Corte" },
  { value: "barba", label: "Barba" },
  { value: "combo", label: "Combo" },
  { value: "hidratacao", label: "Hidratação" },
  { value: "alisamento", label: "Alisamento" },
  { value: "progressiva", label: "Progressiva" },
  { value: "luzes", label: "Luzes" },
  { value: "coloring", label: "Coloração" },
  { value: "manicure", label: "Manicure" },
  { value: "pedicure", label: "Pedicure" },
  { value: "sobrancelha", label: "Sobrancelha" },
  { value: "bigode", label: "Bigode" },
  { value: "outro", label: "Outro" },
];

export default function GestaoServicos() {
  const { barbearias, adicionarServico, editarServico, removerServico, toggleServicoAtivo } = useBarbearias();
  const { toast } = useToast();
  const barbearia = barbearias[0]; // Mock: primeira barbearia
  const servicos = barbearia?.servicos || [];
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<ServicoBarbearia | null>(null);
  const [formData, setFormData] = useState<NovoServicoBarbearia>({
    tipo: "corte",
    nome: "",
    descricao: "",
    duracao: 30,
    valor: 0,
    ativo: true,
    ordem: servicos.length + 1,
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const abrirModalNovoServico = () => {
    setServicoEditando(null);
    setFormData({
      tipo: "corte",
      nome: "",
      descricao: "",
      duracao: 30,
      valor: 0,
      ativo: true,
      ordem: servicos.length + 1,
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (servico: ServicoBarbearia) => {
    setServicoEditando(servico);
    setFormData({
      tipo: servico.tipo as TipoServico,
      nome: servico.nome,
      descricao: servico.descricao || "",
      duracao: servico.duracao,
      valor: servico.valor,
      ativo: servico.ativo,
      ordem: servico.ordem || servicos.length + 1,
    });
    setModalAberto(true);
  };

  const handleSalvar = () => {
    if (!formData.nome || formData.valor <= 0 || formData.duracao <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (nome, duração e valor).",
        variant: "destructive",
      });
      return;
    }

    if (!barbearia) {
      toast({
        title: "Erro",
        description: "Barbearia não encontrada.",
        variant: "destructive",
      });
      return;
    }

    if (servicoEditando) {
      editarServico(barbearia.id, servicoEditando.id, formData);
      toast({
        title: "Serviço atualizado",
        description: "O serviço foi atualizado com sucesso.",
      });
    } else {
      adicionarServico(barbearia.id, formData);
      toast({
        title: "Serviço adicionado",
        description: "O serviço foi adicionado com sucesso.",
      });
    }

    setModalAberto(false);
    setServicoEditando(null);
  };

  const handleRemover = (servicoId: string) => {
    if (!barbearia) return;
    
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      removerServico(barbearia.id, servicoId);
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido com sucesso.",
      });
    }
  };

  const handleToggleAtivo = (servicoId: string) => {
    if (!barbearia) return;
    toggleServicoAtivo(barbearia.id, servicoId);
    toast({
      title: "Status alterado",
      description: "O status do serviço foi alterado.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Serviços</h2>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela sua barbearia
          </p>
        </div>
        <Button onClick={abrirModalNovoServico}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Serviços Disponíveis</CardTitle>
          <CardDescription>
            {servicos.filter((s) => s.ativo).length} ativos de {servicos.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell className="font-medium">{servico.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{servico.tipo}</Badge>
                  </TableCell>
                  <TableCell>{servico.duracao} min</TableCell>
                  <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                  <TableCell>
                    <Badge variant={servico.ativo ? "default" : "secondary"}>
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => abrirModalEditar(servico)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleAtivo(servico.id)}
                        title={servico.ativo ? "Desativar" : "Ativar"}
                      >
                        <Power className={`h-4 w-4 ${servico.ativo ? "text-green-600" : "text-gray-400"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemover(servico.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Adicionar/Editar Serviço */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {servicoEditando ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
            <DialogDescription>
              {servicoEditando
                ? "Atualize as informações do serviço"
                : "Adicione um novo serviço oferecido pela sua barbearia"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Serviço *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo: value as TipoServico })
                  }
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposServico.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Serviço *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Corte Masculino"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o serviço oferecido..."
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (minutos) *</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.duracao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracao: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de Exibição</Label>
              <Input
                id="ordem"
                type="number"
                min="1"
                placeholder="1"
                value={formData.ordem}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ordem: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Número que define a ordem de exibição do serviço na lista
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Serviço Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Serviços inativos não aparecerão para os clientes
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
            </div>

            {formData.valor > 0 && formData.duracao > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold text-lg">
                      {formatarMoeda(formData.valor)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="font-medium">{formData.duracao} minutos</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalAberto(false);
                setServicoEditando(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {servicoEditando ? "Salvar Alterações" : "Adicionar Serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







