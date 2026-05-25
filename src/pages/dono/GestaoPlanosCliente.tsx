import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Power, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function mapPlano(p: any): PlanoCliente {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao || "",
    valor: Number(p.valor) || 0,
    duracaoMeses: p.duracao_meses,
    beneficios: p.beneficios || [],
    ativo: p.ativo,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

interface PlanoCliente {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  duracaoMeses: number;
  beneficios: string[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NovoPlanoCliente {
  nome: string;
  descricao?: string;
  valor: number;
  duracaoMeses: number;
  beneficios: string[];
  ativo: boolean;
}

const duracoesPlanos = [
  { value: 1, label: "Mensal (1 mês)" },
  { value: 3, label: "Trimestral (3 meses)" },
  { value: 6, label: "Semestral (6 meses)" },
  { value: 12, label: "Anual (12 meses)" },
];

export default function GestaoPlanosCliente() {
  const { barbeariaId } = useDono();
  const { toast } = useToast();
  const [planos, setPlanos] = useState<PlanoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<PlanoCliente | null>(null);
  const [beneficioAtual, setBeneficioAtual] = useState("");
  const [formData, setFormData] = useState<NovoPlanoCliente>({
    nome: "",
    descricao: "",
    valor: 0,
    duracaoMeses: 1,
    beneficios: [],
    ativo: true,
  });

  useEffect(() => {
    if (barbeariaId) {
      carregarPlanos();
    }
  }, [barbeariaId]);

  const carregarPlanos = async () => {
    if (!barbeariaId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("planos_cliente")
        .select("*")
        .eq("barbearia_id", barbeariaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPlanos((data || []).map(mapPlano));
    } catch (error: any) {
      console.error("Erro ao carregar planos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos de clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const abrirModalNovoPlano = () => {
    setPlanoEditando(null);
    setFormData({
      nome: "",
      descricao: "",
      valor: 0,
      duracaoMeses: 1,
      beneficios: [],
      ativo: true,
    });
    setBeneficioAtual("");
    setModalAberto(true);
  };

  const abrirModalEditar = (plano: PlanoCliente) => {
    setPlanoEditando(plano);
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao || "",
      valor: plano.valor,
      duracaoMeses: plano.duracaoMeses,
      beneficios: [...plano.beneficios],
      ativo: plano.ativo,
    });
    setBeneficioAtual("");
    setModalAberto(true);
  };

  const adicionarBeneficio = () => {
    if (beneficioAtual.trim()) {
      setFormData({
        ...formData,
        beneficios: [...formData.beneficios, beneficioAtual.trim()],
      });
      setBeneficioAtual("");
    }
  };

  const removerBeneficio = (index: number) => {
    setFormData({
      ...formData,
      beneficios: formData.beneficios.filter((_, i) => i !== index),
    });
  };

  const handleSalvar = async () => {
    if (!formData.nome || formData.valor <= 0 || formData.duracaoMeses <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (nome, valor e duração).",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        valor: formData.valor,
        duracao_meses: formData.duracaoMeses,
        beneficios: formData.beneficios,
        ativo: formData.ativo,
        barbearia_id: barbeariaId,
      };
      if (planoEditando) {
        const { error } = await supabase
          .from("planos_cliente")
          .update(payload)
          .eq("id", planoEditando.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Plano atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("planos_cliente").insert(payload);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Plano criado com sucesso!" });
      }

      setModalAberto(false);
      setPlanoEditando(null);
      carregarPlanos();
    } catch (error: any) {
      console.error("Erro ao salvar plano:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar plano",
        variant: "destructive",
      });
    }
  };

  const handleRemover = async (planoId: string) => {
    if (!confirm("Tem certeza que deseja remover este plano? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase.from("planos_cliente").delete().eq("id", planoId);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Plano removido com sucesso!" });
      carregarPlanos();
    } catch (error: any) {
      console.error("Erro ao remover plano:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover plano",
        variant: "destructive",
      });
    }
  };

  const handleToggleAtivo = async (planoId: string) => {
    try {
      const plano = planos.find((p) => p.id === planoId);
      if (!plano) return;

      const { error } = await supabase
        .from("planos_cliente")
        .update({ ativo: !plano.ativo })
        .eq("id", planoId);
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Plano ${!plano.ativo ? "ativado" : "desativado"} com sucesso!`,
      });
      carregarPlanos();
    } catch (error: any) {
      console.error("Erro ao alterar status do plano:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do plano",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Planos de Clientes
          </h2>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura oferecidos aos seus clientes
          </p>
        </div>
        <Button onClick={abrirModalNovoPlano}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <CardDescription>
            {planos.filter((p) => p.ativo).length} ativos de {planos.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {planos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum plano cadastrado ainda.</p>
              <p className="text-sm mt-2">Clique em "Novo Plano" para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Benefícios</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell className="font-medium">{plano.nome}</TableCell>
                    <TableCell>
                      {plano.duracaoMeses} {plano.duracaoMeses === 1 ? "mês" : "meses"}
                    </TableCell>
                    <TableCell>{formatarMoeda(plano.valor)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plano.beneficios.slice(0, 2).map((beneficio, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {beneficio}
                          </Badge>
                        ))}
                        {plano.beneficios.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{plano.beneficios.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plano.ativo ? "default" : "secondary"}>
                        {plano.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirModalEditar(plano)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAtivo(plano.id)}
                          title={plano.ativo ? "Desativar" : "Ativar"}
                        >
                          <Power className={`h-4 w-4 ${plano.ativo ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemover(plano.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Modal de Adicionar/Editar Plano */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {planoEditando ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
            <DialogDescription>
              {planoEditando
                ? "Atualize as informações do plano"
                : "Crie um novo plano de assinatura para seus clientes"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Plano *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Plano Mensal"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracaoMeses">Duração *</Label>
                <select
                  id="duracaoMeses"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.duracaoMeses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracaoMeses: parseInt(e.target.value) || 1,
                    })
                  }
                >
                  {duracoesPlanos.map((duracao) => (
                    <option key={duracao.value} value={duracao.value}>
                      {duracao.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o plano e seus benefícios..."
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor Mensal (R$) *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="beneficios">Benefícios do Plano</Label>
              <div className="flex gap-2">
                <Input
                  id="beneficios"
                  placeholder="Ex: Desconto de 10% em todos os serviços"
                  value={beneficioAtual}
                  onChange={(e) => setBeneficioAtual(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarBeneficio();
                    }
                  }}
                />
                <Button type="button" onClick={adicionarBeneficio}>
                  Adicionar
                </Button>
              </div>
              {formData.beneficios.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.beneficios.map((beneficio, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removerBeneficio(index)}
                    >
                      {beneficio} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Plano Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Planos inativos não aparecerão para os clientes
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

            {formData.valor > 0 && formData.duracaoMeses > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Mensal:</span>
                    <span className="font-bold text-lg">
                      {formatarMoeda(formData.valor)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="font-medium">
                      {formData.duracaoMeses} {formData.duracaoMeses === 1 ? "mês" : "meses"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="text-muted-foreground">Valor Total:</span>
                    <span className="font-bold text-lg text-primary">
                      {formatarMoeda(formData.valor * formData.duracaoMeses)}
                    </span>
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
                setPlanoEditando(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {planoEditando ? "Salvar Alterações" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

