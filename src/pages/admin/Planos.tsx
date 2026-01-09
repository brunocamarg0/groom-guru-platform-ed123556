import { useState } from "react";
import { usePlanos } from "@/context/PlanosContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { Plano, NovoPlano, RecursoPlano } from "@/types/plano";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const recursosDisponiveis: RecursoPlano[] = [
  { id: "whatsapp", nome: "Integração WhatsApp", descricao: "Envio de notificações via WhatsApp" },
  { id: "pagamentos", nome: "Gateway de Pagamentos", descricao: "Integração com gateways de pagamento" },
  { id: "relatorios", nome: "Relatórios Avançados", descricao: "Relatórios detalhados de performance" },
  { id: "agendamento_online", nome: "Agendamento Online", descricao: "Sistema de agendamento para clientes" },
  { id: "app_mobile", nome: "App Mobile", descricao: "Aplicativo mobile para barbeiros" },
  { id: "suporte_prioritario", nome: "Suporte Prioritário", descricao: "Atendimento prioritário 24/7" },
  { id: "marketing", nome: "Ferramentas de Marketing", descricao: "Campanhas e promoções" },
  { id: "multi_unidade", nome: "Múltiplas Unidades", descricao: "Gerenciar várias unidades" },
];

export default function Planos() {
  const { planos, adicionarPlano, editarPlano, excluirPlano } = usePlanos();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);
  const [formData, setFormData] = useState<Partial<NovoPlano>>({
    nome: "",
    descricao: "",
    valorMensal: 0,
    limiteBarbeiros: 1,
    limiteAgendamentos: 100,
    recursos: [],
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const abrirDialogNovo = () => {
    setPlanoEditando(null);
    setFormData({
      nome: "",
      descricao: "",
      valorMensal: 0,
      limiteBarbeiros: 1,
      limiteAgendamentos: 100,
      recursos: [],
    });
    setIsDialogOpen(true);
  };

  const abrirDialogEditar = (plano: Plano) => {
    setPlanoEditando(plano);
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao,
      valorMensal: plano.valorMensal,
      limiteBarbeiros: plano.limiteBarbeiros,
      limiteAgendamentos: plano.limiteAgendamentos,
      recursos: plano.recursos,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.valorMensal) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (planoEditando) {
      editarPlano(planoEditando.id, formData);
      toast({
        title: "Plano atualizado",
        description: `${formData.nome} foi atualizado com sucesso.`,
      });
    } else {
      adicionarPlano(formData as NovoPlano);
      toast({
        title: "Plano criado",
        description: `${formData.nome} foi criado com sucesso.`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleExcluir = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o plano "${nome}"?`)) {
      excluirPlano(id);
      toast({
        title: "Plano excluído",
        description: `${nome} foi excluído com sucesso.`,
      });
    }
  };

  const toggleRecurso = (recursoId: string) => {
    const recursosAtuais = formData.recursos || [];
    const recurso = recursosDisponiveis.find((r) => r.id === recursoId);

    if (!recurso) return;

    const jaExiste = recursosAtuais.some((r) => r.id === recursoId);
    if (jaExiste) {
      setFormData({
        ...formData,
        recursos: recursosAtuais.filter((r) => r.id !== recursoId),
      });
    } else {
      setFormData({
        ...formData,
        recursos: [...recursosAtuais, recurso],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planos & Assinaturas</h2>
          <p className="text-muted-foreground">
            Gerencie os planos disponíveis e suas configurações
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogNovo}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {planoEditando ? "Editar Plano" : "Novo Plano"}
              </DialogTitle>
              <DialogDescription>
                {planoEditando
                  ? "Atualize as informações do plano"
                  : "Preencha os dados para criar um novo plano"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Plano *</Label>
                <Input
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorMensal">Valor Mensal (R$) *</Label>
                  <Input
                    id="valorMensal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorMensal || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valorMensal: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limiteBarbeiros">Limite de Barbeiros *</Label>
                  <Input
                    id="limiteBarbeiros"
                    type="number"
                    min="1"
                    value={formData.limiteBarbeiros || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limiteBarbeiros: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limiteAgendamentos">
                  Limite de Agendamentos *</Label>
                <Input
                  id="limiteAgendamentos"
                  type="number"
                  min="1"
                  value={formData.limiteAgendamentos || 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limiteAgendamentos: parseInt(e.target.value) || 100,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Recursos Liberados</Label>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {recursosDisponiveis.map((recurso) => {
                    const selecionado = formData.recursos?.some(
                      (r) => r.id === recurso.id
                    );
                    return (
                      <div
                        key={recurso.id}
                        className="flex items-start space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                        onClick={() => toggleRecurso(recurso.id)}
                      >
                        <Checkbox
                          checked={selecionado}
                          onCheckedChange={() => toggleRecurso(recurso.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {recurso.nome}
                          </div>
                          {recurso.descricao && (
                            <div className="text-xs text-muted-foreground">
                              {recurso.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {planoEditando ? "Salvar Alterações" : "Criar Plano"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <CardDescription>
            Lista de todos os planos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Limite Barbeiros</TableHead>
                <TableHead>Limite Agendamentos</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum plano cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                planos.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell className="font-medium">{plano.nome}</TableCell>
                    <TableCell>{formatarMoeda(plano.valorMensal)}</TableCell>
                    <TableCell>{plano.limiteBarbeiros}</TableCell>
                    <TableCell>{plano.limiteAgendamentos}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plano.recursos.slice(0, 2).map((recurso) => (
                          <Badge key={recurso.id} variant="secondary" className="text-xs">
                            {recurso.nome}
                          </Badge>
                        ))}
                        {plano.recursos.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{plano.recursos.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {plano.ativo ? (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <X className="h-3 w-3" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirDialogEditar(plano)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExcluir(plano.id, plano.nome)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}



