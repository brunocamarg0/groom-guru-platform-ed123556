import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  DialogTrigger,
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
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ServicoBarbearia, NovoServicoBarbearia } from "@/types/barbearia";

type TipoServico = "corte" | "barba" | "combo" | "hidratacao" | "alisamento" | "progressiva" | "luzes" | "coloring" | "manicure" | "pedicure" | "sobrancelha" | "bigode" | "outro";

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

export default function ServicosBarbearia() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBarbearia, adicionarServico, editarServico, removerServico, toggleServicoAtivo } = useBarbearias();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<ServicoBarbearia | null>(null);

  const barbearia = id ? getBarbearia(id) : undefined;

  const [formData, setFormData] = useState<NovoServicoBarbearia>({
    tipo: "corte",
    nome: "",
    descricao: "",
    duracao: 30,
    valor: 0,
    ativo: true,
    ordem: 0,
  });

  if (!barbearia) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Barbearia não encontrada</p>
          <Button onClick={() => navigate("/admin")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const servicos = barbearia.servicos || [];

  const handleSubmit = () => {
    if (!formData.nome || formData.valor <= 0 || formData.duracao <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
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

    setIsDialogOpen(false);
    setServicoEditando(null);
    setFormData({
      tipo: "corte",
      nome: "",
      descricao: "",
      duracao: 30,
      valor: 0,
      ativo: true,
      ordem: 0,
    });
  };

  const handleEdit = (servico: ServicoBarbearia) => {
    setServicoEditando(servico);
    setFormData({
      tipo: servico.tipo as TipoServico,
      nome: servico.nome,
      descricao: servico.descricao || "",
      duracao: servico.duracao,
      valor: servico.valor,
      ativo: servico.ativo,
      ordem: servico.ordem || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (servicoId: string) => {
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      removerServico(barbearia.id, servicoId);
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido com sucesso.",
      });
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Serviços - {barbearia.nome}</h2>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela barbearia
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
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
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {servicoEditando ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes do serviço
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Serviço</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
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
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Hidratação Capilar"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o serviço..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracao">Duração (minutos) *</Label>
                  <Input
                    id="duracao"
                    type="number"
                    value={formData.duracao}
                    onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Serviço Ativo</Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {servicoEditando ? "Salvar Alterações" : "Adicionar Serviço"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              {servicos
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell className="font-medium">{servico.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tiposServico.find((t) => t.value === servico.tipo)?.label || servico.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{servico.duracao} min</TableCell>
                    <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                    <TableCell>
                      <Badge variant={servico.ativo ? "default" : "secondary"}>
                        {servico.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleServicoAtivo(barbearia.id, servico.id)}
                          title={servico.ativo ? "Desativar" : "Ativar"}
                        >
                          <Power className={`h-4 w-4 ${servico.ativo ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(servico)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(servico.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}







