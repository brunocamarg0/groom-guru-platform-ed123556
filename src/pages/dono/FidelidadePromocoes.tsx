import { useState } from "react";
import { useDono } from "@/context/DonoContext";
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
import { Plus, Gift, Tag, Edit, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PromocaoDono } from "@/types/dono";
import { apiDelete, apiPut } from "@/services/api";

export default function FidelidadePromocoes() {
  const { promocoes, criarPromocao, atualizarPromocao, servicos } = useDono();
  const [modalAberto, setModalAberto] = useState(false);
  const [promocaoEditando, setPromocaoEditando] = useState<PromocaoDono | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "desconto_percentual" as PromocaoDono["tipo"],
    valor: 0,
    validoDe: new Date().toISOString().split("T")[0],
    validoAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ativo: true,
    aplicavelA: "todos" as PromocaoDono["aplicavelA"],
    servicoId: "",
    horarioInicio: "",
    horarioFim: "",
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarValorPromocao = (promocao: PromocaoDono) => {
    switch (promocao.tipo) {
      case "desconto_percentual":
        return `${promocao.valor}%`;
      case "desconto_fixo":
        return formatarMoeda(promocao.valor);
      case "cashback":
        return `${promocao.valor}% cashback`;
      case "pontos":
        return `${promocao.valor} pontos`;
      default:
        return String(promocao.valor);
    }
  };

  const abrirModalNovo = () => {
    setPromocaoEditando(null);
    setFormData({
      nome: "",
      tipo: "desconto_percentual",
      valor: 0,
      validoDe: new Date().toISOString().split("T")[0],
      validoAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      ativo: true,
      aplicavelA: "todos",
      servicoId: "",
      horarioInicio: "",
      horarioFim: "",
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (promocao: PromocaoDono) => {
    setPromocaoEditando(promocao);
    setFormData({
      nome: promocao.nome,
      tipo: promocao.tipo,
      valor: promocao.valor,
      validoDe: promocao.validoDe.split("T")[0],
      validoAte: promocao.validoAte.split("T")[0],
      ativo: promocao.ativo,
      aplicavelA: promocao.aplicavelA,
      servicoId: promocao.servicoId || "",
      horarioInicio: promocao.horarioInicio || "",
      horarioFim: promocao.horarioFim || "",
    });
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (formData.valor <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    setSalvando(true);
    try {
      if (promocaoEditando) {
        await atualizarPromocao(promocaoEditando.id, formData);
      } else {
        await criarPromocao(formData);
      }
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar promoção:", error);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta promoção?")) return;
    
    try {
      await apiDelete(`/dono/promocoes/${id}`);
      toast.success("Promoção excluída!");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir promoção");
    }
  };

  const handleToggleAtivo = async (promocao: PromocaoDono) => {
    try {
      await atualizarPromocao(promocao.id, { ativo: !promocao.ativo });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const promocoesAtivas = promocoes.filter((p) => p.ativo);
  const promocoesExpiradas = promocoes.filter((p) => new Date(p.validoAte) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Fidelidade & Promoções</h2>
          <p className="text-muted-foreground">
            Gerencie programas de fidelidade e promoções
          </p>
        </div>
        <Button onClick={abrirModalNovo}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Promoções Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {promocoesAtivas.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Promoções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promocoes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{promocoesExpiradas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Programa de Pontos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Ativo</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promoções</CardTitle>
          <CardDescription>
            Gerencie suas promoções e descontos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promocoes.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma promoção cadastrada</p>
              <Button className="mt-4" onClick={abrirModalNovo}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Promoção
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Aplicável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promocoes.map((promocao) => (
                  <TableRow key={promocao.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-purple-600" />
                        {promocao.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {promocao.tipo.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatarValorPromocao(promocao)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(promocao.validoDe).toLocaleDateString("pt-BR")} - {new Date(promocao.validoAte).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {promocao.aplicavelA === "todos" ? "Todos" :
                         promocao.aplicavelA === "servico" ? "Serviço específico" :
                         promocao.aplicavelA === "horario" ? "Horário específico" : "VIPs"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={promocao.ativo ? "default" : "secondary"}>
                        {promocao.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirModalEditar(promocao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAtivo(promocao)}
                        >
                          <Switch checked={promocao.ativo} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleExcluir(promocao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {promocaoEditando ? "Editar Promoção" : "Nova Promoção"}
            </DialogTitle>
            <DialogDescription>
              {promocaoEditando
                ? "Atualize as informações da promoção"
                : "Crie uma nova promoção para seus clientes"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Promoção *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Desconto de Verão"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Promoção *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as PromocaoDono["tipo"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desconto_percentual">Desconto Percentual</SelectItem>
                    <SelectItem value="desconto_fixo">Desconto Fixo (R$)</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="pontos">Pontos de Fidelidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">
                  {formData.tipo === "desconto_percentual" || formData.tipo === "cashback"
                    ? "Percentual (%)"
                    : formData.tipo === "pontos"
                    ? "Quantidade de Pontos"
                    : "Valor (R$)"}
                </Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step={formData.tipo === "desconto_fixo" ? "0.01" : "1"}
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aplicavelA">Aplicável a</Label>
                <Select
                  value={formData.aplicavelA}
                  onValueChange={(value) => setFormData({ ...formData, aplicavelA: value as PromocaoDono["aplicavelA"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Clientes</SelectItem>
                    <SelectItem value="cliente_vip">Apenas VIPs</SelectItem>
                    <SelectItem value="servico">Serviço Específico</SelectItem>
                    <SelectItem value="horario">Horário Específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.aplicavelA === "servico" && (
              <div className="space-y-2">
                <Label htmlFor="servicoId">Serviço</Label>
                <Select
                  value={formData.servicoId}
                  onValueChange={(value) => setFormData({ ...formData, servicoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((servico: any) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.aplicavelA === "horario" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horarioInicio">Horário Início</Label>
                  <Input
                    id="horarioInicio"
                    type="time"
                    value={formData.horarioInicio}
                    onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horarioFim">Horário Fim</Label>
                  <Input
                    id="horarioFim"
                    type="time"
                    value={formData.horarioFim}
                    onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validoDe">Válido de *</Label>
                <Input
                  id="validoDe"
                  type="date"
                  value={formData.validoDe}
                  onChange={(e) => setFormData({ ...formData, validoDe: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validoAte">Válido até *</Label>
                <Input
                  id="validoAte"
                  type="date"
                  value={formData.validoAte}
                  onChange={(e) => setFormData({ ...formData, validoAte: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Promoção Ativa</Label>
                <p className="text-xs text-muted-foreground">
                  Promoções inativas não são aplicadas
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando ? "Salvando..." : promocaoEditando ? "Salvar Alterações" : "Criar Promoção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
