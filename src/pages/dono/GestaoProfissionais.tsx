import { useState } from "react";
import { useDono } from "@/context/DonoContext";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfissionalDono } from "@/types/dono";

export default function GestaoProfissionais() {
  const { profissionais, adicionarProfissional, atualizarProfissional, removerProfissional } = useDono();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [profissionalEditando, setProfissionalEditando] = useState<ProfissionalDono | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    especialidades: [] as string[],
    comissaoTipo: "percentual" as "percentual" | "fixo",
    comissaoValor: 40,
    comissaoAssinatura: 0,
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.telefone) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      await adicionarProfissional({
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email || undefined,
        especialidades: formData.especialidades,
        comissao: {
          tipo: formData.comissaoTipo,
          valor: formData.comissaoValor,
        },
        comissaoAssinatura: formData.comissaoAssinatura,
        ativo: true,
      } as any);

      setIsDialogOpen(false);
      setFormData({
        nome: "",
        telefone: "",
        email: "",
        especialidades: [],
        comissaoTipo: "percentual",
        comissaoValor: 40,
        comissaoAssinatura: 0,
      });
    } catch (error) {
      // Erro já é tratado no contexto
    } finally {
      setSalvando(false);
    }
  };

  const handleEdit = (profissional: ProfissionalDono) => {
    setProfissionalEditando(profissional);
    setFormData({
      nome: profissional.nome,
      telefone: profissional.telefone,
      email: profissional.email || "",
      especialidades: profissional.especialidades || [],
      comissaoTipo: profissional.comissao.tipo,
      comissaoValor: profissional.comissao.valor,
      comissaoAssinatura: (profissional as any).comissaoAssinatura || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!profissionalEditando || !formData.nome || !formData.telefone) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await atualizarProfissional(profissionalEditando.id, {
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email || undefined,
        especialidades: formData.especialidades,
        comissao: {
          tipo: formData.comissaoTipo,
          valor: formData.comissaoValor,
        },
        comissaoAssinatura: formData.comissaoAssinatura,
      } as any);

      setIsEditDialogOpen(false);
      setProfissionalEditando(null);
      setFormData({
        nome: "",
        telefone: "",
        email: "",
        especialidades: [],
        comissaoTipo: "percentual",
        comissaoValor: 40,
        comissaoAssinatura: 0,
      });
    } catch (error) {
      // Erro já é tratado no contexto
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este profissional?")) {
      return;
    }

    try {
      await removerProfissional(id);
    } catch (error) {
      // Erro já é tratado no contexto
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Gestão de Profissionais</h2>
          <p className="text-muted-foreground">
            Gerencie os profissionais da sua barbearia
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Profissional
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Profissional</DialogTitle>
              <DialogDescription>
                Cadastre um novo profissional na sua barbearia
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comissaoTipo">Tipo de Comissão</Label>
                  <select
                    id="comissaoTipo"
                    value={formData.comissaoTipo}
                    onChange={(e) => setFormData({ ...formData, comissaoTipo: e.target.value as "percentual" | "fixo" })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="percentual">Percentual</option>
                    <option value="fixo">Valor Fixo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comissaoValor">
                    {formData.comissaoTipo === "percentual" ? "Percentual (%)" : "Valor (R$)"}
                  </Label>
                  <Input
                    id="comissaoValor"
                    type="number"
                    value={formData.comissaoValor}
                    onChange={(e) => setFormData({ ...formData, comissaoValor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comissaoAssinatura">Comissão por Assinatura (R$)</Label>
                <Input
                  id="comissaoAssinatura"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.comissaoAssinatura}
                  onChange={(e) => setFormData({ ...formData, comissaoAssinatura: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Valor fixo pago ao profissional por cada pagamento de assinatura de cliente
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={salvando}>
                {salvando ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Profissional</DialogTitle>
              <DialogDescription>
                Atualize as informações do profissional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone *</Label>
                <Input
                  id="edit-telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-comissaoTipo">Tipo de Comissão</Label>
                  <select
                    id="edit-comissaoTipo"
                    value={formData.comissaoTipo}
                    onChange={(e) => setFormData({ ...formData, comissaoTipo: e.target.value as "percentual" | "fixo" })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="percentual">Percentual</option>
                    <option value="fixo">Valor Fixo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-comissaoValor">
                    {formData.comissaoTipo === "percentual" ? "Percentual (%)" : "Valor (R$)"}
                  </Label>
                  <Input
                    id="edit-comissaoValor"
                    type="number"
                    value={formData.comissaoValor}
                    onChange={(e) => setFormData({ ...formData, comissaoValor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-comissaoAssinatura">Comissão por Assinatura (R$)</Label>
                <Input
                  id="edit-comissaoAssinatura"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.comissaoAssinatura}
                  onChange={(e) => setFormData({ ...formData, comissaoAssinatura: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Valor fixo pago ao profissional por cada pagamento de assinatura de cliente
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profissionais.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profissionais.filter((p) => p.ativo).length} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(profissionais.reduce((sum, p) => sum + p.faturamentoTotal, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profissionais.length > 0
                ? (profissionais.reduce((sum, p) => sum + p.avaliacaoMedia, 0) / profissionais.length).toFixed(1)
                : "0.0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Desempenho</CardTitle>
          <CardDescription>
            Profissionais ordenados por faturamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Faltas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profissionais
                .sort((a, b) => b.faturamentoTotal - a.faturamentoTotal)
                .map((profissional) => (
                  <TableRow key={profissional.id}>
                    <TableCell className="font-medium">{profissional.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{profissional.avaliacaoMedia.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({profissional.totalAvaliacoes})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatarMoeda(profissional.faturamentoTotal)}</TableCell>
                    <TableCell>
                      {profissional.comissao.tipo === "percentual"
                        ? `${profissional.comissao.valor}%`
                        : formatarMoeda(profissional.comissao.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={profissional.faltas > 0 ? "destructive" : "default"}>
                        {profissional.faltas}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(profissional)}
                          title="Editar profissional"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(profissional.id)}
                          title="Remover profissional"
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







