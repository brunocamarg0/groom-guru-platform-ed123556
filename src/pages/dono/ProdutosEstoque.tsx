import { useState } from "react";
import { useDono } from "@/context/DonoContext";
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
import { Plus, AlertTriangle, Package, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { ProdutoDono } from "@/types/dono";
import { apiDelete } from "@/services/api";

export default function ProdutosEstoque() {
  const { produtos, adicionarProduto, atualizarProduto, atualizarEstoque } = useDono();
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEstoque, setModalEstoque] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoDono | null>(null);
  const [produtoEstoque, setProdutoEstoque] = useState<ProdutoDono | null>(null);
  const [quantidadeEstoque, setQuantidadeEstoque] = useState(0);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<"entrada" | "saida">("entrada");
  const [salvando, setSalvando] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "pomada" as ProdutoDono["categoria"],
    preco: 0,
    estoque: 0,
    estoqueMinimo: 5,
    ativo: true,
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const produtosEstoqueBaixo = produtos.filter((p) => p.estoque <= p.estoqueMinimo);
  const valorTotalEstoque = produtos.reduce((sum, p) => sum + (p.preco * p.estoque), 0);

  const abrirModalNovo = () => {
    setProdutoEditando(null);
    setFormData({
      nome: "",
      descricao: "",
      categoria: "pomada",
      preco: 0,
      estoque: 0,
      estoqueMinimo: 5,
      ativo: true,
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (produto: ProdutoDono) => {
    setProdutoEditando(produto);
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || "",
      categoria: produto.categoria,
      preco: produto.preco,
      estoque: produto.estoque,
      estoqueMinimo: produto.estoqueMinimo,
      ativo: produto.ativo,
    });
    setModalAberto(true);
  };

  const abrirModalEstoque = (produto: ProdutoDono) => {
    setProdutoEstoque(produto);
    setQuantidadeEstoque(0);
    setTipoMovimentacao("entrada");
    setModalEstoque(true);
  };

  const handleSalvar = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (formData.preco <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }

    setSalvando(true);
    try {
      if (produtoEditando) {
        await atualizarProduto(produtoEditando.id, formData);
      } else {
        await adicionarProduto(formData);
      }
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarEstoque = async () => {
    if (!produtoEstoque || quantidadeEstoque <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }

    setSalvando(true);
    try {
      const novoEstoque = tipoMovimentacao === "entrada"
        ? produtoEstoque.estoque + quantidadeEstoque
        : Math.max(0, produtoEstoque.estoque - quantidadeEstoque);
      
      await atualizarEstoque(produtoEstoque.id, novoEstoque);
      setModalEstoque(false);
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    
    try {
      await apiDelete(`/dono/produtos/${id}`);
      toast.success("Produto excluído!");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir produto");
    }
  };

  const categorias = [
    { value: "pomada", label: "Pomada" },
    { value: "oleo", label: "Óleo" },
    { value: "kit", label: "Kit" },
    { value: "outro", label: "Outro" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Produtos & Estoque</h2>
          <p className="text-muted-foreground">
            Controle de produtos e estoque da sua barbearia
          </p>
        </div>
        <Button onClick={abrirModalNovo}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {produtosEstoqueBaixo.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {produtosEstoqueBaixo.map((produto) => (
                <div key={produto.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <span>{produto.nome}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{produto.estoque} unidades</Badge>
                    <Button size="sm" onClick={() => abrirModalEstoque(produto)}>
                      Repor
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
            <p className="text-xs text-muted-foreground">
              {produtos.filter(p => p.ativo).length} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor Total Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatarMoeda(valorTotalEstoque)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{produtosEstoqueBaixo.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {produtos.filter(p => p.estoque === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            Gerencie seus produtos e controle o estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              <Button className="mt-4" onClick={abrirModalNovo}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Produto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Valor em Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{produto.nome}</p>
                        {produto.descricao && (
                          <p className="text-xs text-muted-foreground">{produto.descricao}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categorias.find(c => c.value === produto.categoria)?.label || produto.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatarMoeda(produto.preco)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={produto.estoque <= produto.estoqueMinimo ? "text-red-600 font-medium" : ""}>
                          {produto.estoque}
                        </span>
                        {produto.estoque <= produto.estoqueMinimo && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatarMoeda(produto.preco * produto.estoque)}</TableCell>
                    <TableCell>
                      <Badge variant={produto.ativo ? "default" : "secondary"}>
                        {produto.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirModalEstoque(produto)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Estoque
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirModalEditar(produto)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleExcluir(produto.id)}
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

      {/* Modal de Criação/Edição de Produto */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {produtoEditando ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {produtoEditando
                ? "Atualize as informações do produto"
                : "Adicione um novo produto ao seu catálogo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                placeholder="Ex: Pomada Modeladora"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição do produto..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value as ProdutoDono["categoria"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (R$) *</Label>
                <Input
                  id="preco"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estoque">Estoque Inicial</Label>
                <Input
                  id="estoque"
                  type="number"
                  min="0"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                <Input
                  id="estoqueMinimo"
                  type="number"
                  min="0"
                  value={formData.estoqueMinimo}
                  onChange={(e) => setFormData({ ...formData, estoqueMinimo: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Produto Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Produtos inativos não aparecem para venda
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
              {salvando ? "Salvando..." : produtoEditando ? "Salvar Alterações" : "Adicionar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Movimentação de Estoque */}
      <Dialog open={modalEstoque} onOpenChange={setModalEstoque}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              {produtoEstoque?.nome} - Estoque atual: {produtoEstoque?.estoque} unidades
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <div className="flex gap-2">
                <Button
                  variant={tipoMovimentacao === "entrada" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTipoMovimentacao("entrada")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Entrada
                </Button>
                <Button
                  variant={tipoMovimentacao === "saida" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTipoMovimentacao("saida")}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Saída
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={quantidadeEstoque}
                onChange={(e) => setQuantidadeEstoque(parseInt(e.target.value) || 0)}
              />
            </div>

            {produtoEstoque && quantidadeEstoque > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Novo estoque: </span>
                  <span className="font-bold">
                    {tipoMovimentacao === "entrada"
                      ? produtoEstoque.estoque + quantidadeEstoque
                      : Math.max(0, produtoEstoque.estoque - quantidadeEstoque)} unidades
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEstoque(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAtualizarEstoque} disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
