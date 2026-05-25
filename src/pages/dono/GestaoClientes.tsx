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
import { Badge } from "@/components/ui/badge";
import { Plus, Crown, Search, Edit, Trash2, UserPlus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GestaoClientes() {
  const { clientes, profissionais, marcarClienteVIP, adicionarCliente, atualizarCliente, removerCliente } = useDono();
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [modalAtribuirAberto, setModalAtribuirAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<{ id: string; nome: string; email: string; telefone: string } | null>(null);
  const [clienteAtribuindo, setClienteAtribuindo] = useState<{ id: string; nome: string } | null>(null);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [atribuindo, setAtribuindo] = useState(false);
  const [formCliente, setFormCliente] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const clientesFiltrados = busca
    ? clientes.filter((c) =>
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.telefone.includes(busca)
      )
    : clientes;

  const handleSalvar = async () => {
    if (!formCliente.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formCliente.email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    if (!formCliente.telefone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }

    setSalvando(true);
    try {
      await adicionarCliente({
        nome: formCliente.nome.trim(),
        email: formCliente.email.trim(),
        telefone: formCliente.telefone.trim(),
        vip: false,
      });

      // Limpar formulário e fechar modal
      setFormCliente({
        nome: "",
        email: "",
        telefone: "",
      });
      setModalAberto(false);
      
      // Scroll suave até a lista de clientes após um pequeno delay
      setTimeout(() => {
        const listaElement = document.getElementById('lista-clientes');
        if (listaElement) {
          listaElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar cliente");
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (cliente: any) => {
    setClienteEditando({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email || "",
      telefone: cliente.telefone || "",
    });
    setFormCliente({
      nome: cliente.nome,
      email: cliente.email || "",
      telefone: cliente.telefone || "",
    });
    setModalEdicaoAberto(true);
  };

  const handleSalvarEdicao = async () => {
    if (!clienteEditando) return;

    if (!formCliente.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formCliente.email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    if (!formCliente.telefone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }

    setSalvando(true);
    try {
      await atualizarCliente(clienteEditando.id, {
        nome: formCliente.nome.trim(),
        email: formCliente.email.trim(),
        telefone: formCliente.telefone.trim(),
      });

      setModalEdicaoAberto(false);
      setClienteEditando(null);
      setFormCliente({
        nome: "",
        email: "",
        telefone: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar cliente");
    } finally {
      setSalvando(false);
    }
  };

  const handleAtribuirProfissional = (cliente: any) => {
    setClienteAtribuindo(cliente);
    setProfissionalSelecionado("");
    setModalAtribuirAberto(true);
  };

  const handleSalvarAtribuicao = async () => {
    if (!clienteAtribuindo || !profissionalSelecionado) {
      toast.error("Selecione um profissional");
      return;
    }

    setAtribuindo(true);
    try {
      const { error } = await supabase.from("cliente_profissional").insert({
        cliente_id: clienteAtribuindo.id,
        profissional_id: profissionalSelecionado,
        ativo: true,
      });
      if (error) throw error;

      toast.success("Cliente atribuído ao profissional com sucesso!");
      setModalAtribuirAberto(false);
      setClienteAtribuindo(null);
      setProfissionalSelecionado("");
    } catch (error: any) {
      console.error("Erro ao atribuir cliente:", error);
      toast.error(error.message || "Erro ao atribuir cliente ao profissional");
    } finally {
      setAtribuindo(false);
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover o cliente "${nome}"?`)) {
      return;
    }

    setExcluindo(id);
    try {
      await removerCliente(id);
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover cliente");
    } finally {
      setExcluindo(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Gestão de Clientes</h2>
          <p className="text-muted-foreground">
            CRM simples e poderoso para gerenciar seus clientes
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.filter((c) => c.vip).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(
                clientes.length > 0
                  ? clientes.reduce((sum, c) => sum + c.ticketMedio, 0) / clientes.length
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter((c) => c.frequencia >= 2).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="lista-clientes">
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {clientesFiltrados.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Agendamentos</TableHead>
                <TableHead>Ticket Médio</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Último Atendimento</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {cliente.nome}
                      {cliente.vip && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{cliente.telefone}</TableCell>
                  <TableCell>{cliente.totalAgendamentos}</TableCell>
                  <TableCell>{formatarMoeda(cliente.ticketMedio)}</TableCell>
                  <TableCell>{cliente.frequencia}/mês</TableCell>
                  <TableCell>
                    {cliente.ultimoAgendamento
                      ? new Date(cliente.ultimoAgendamento).toLocaleDateString("pt-BR")
                      : "Nunca"}
                  </TableCell>
                  <TableCell>
                    {(cliente as any).temAssinatura ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <Receipt className="h-3 w-3" />
                        {(cliente as any).assinatura?.plano?.nome || "Com Assinatura"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Sem Assinatura</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cliente.vip ? "default" : "secondary"}>
                      {cliente.vip ? "VIP" : "Regular"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAtribuirProfissional(cliente)}
                        title="Atribuir a profissional"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditar(cliente)}
                        title="Editar cliente"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluir(cliente.id, cliente.nome)}
                        disabled={excluindo === cliente.id}
                        title="Excluir cliente"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {excluindo === cliente.id ? (
                          "Excluindo..."
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => marcarClienteVIP(cliente.id, !cliente.vip)}
                        title={cliente.vip ? "Remover VIP" : "Marcar VIP"}
                      >
                        {cliente.vip ? "Remover VIP" : "Marcar VIP"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para adicionar novo cliente */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Novo Cliente</DialogTitle>
            <DialogDescription className="text-gray-600">
              Adicione um novo cliente ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-900">
                Nome *
              </Label>
              <Input
                id="nome"
                placeholder="Nome completo do cliente"
                value={formCliente.nome}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, nome: e.target.value })
                }
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formCliente.email}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, email: e.target.value })
                }
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-gray-900">
                Telefone *
              </Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                value={formCliente.telefone}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, telefone: e.target.value })
                }
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalAberto(false)}
              className="text-gray-900 border-gray-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvar} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar cliente */}
      <Dialog open={modalEdicaoAberto} onOpenChange={setModalEdicaoAberto}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Editar Cliente</DialogTitle>
            <DialogDescription className="text-gray-600">
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome" className="text-gray-900">
                Nome *
              </Label>
              <Input
                id="edit-nome"
                placeholder="Nome completo do cliente"
                value={formCliente.nome}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, nome: e.target.value })
                }
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-gray-900">
                Email *
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@exemplo.com"
                value={formCliente.email}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, email: e.target.value })
                }
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefone" className="text-gray-900">
                Telefone *
              </Label>
              <Input
                id="edit-telefone"
                placeholder="(11) 99999-9999"
                value={formCliente.telefone}
                onChange={(e) =>
                  setFormCliente({ ...formCliente, telefone: e.target.value })
                }
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalEdicaoAberto(false);
                setClienteEditando(null);
                setFormCliente({ nome: "", email: "", telefone: "" });
              }}
              className="text-gray-900 border-gray-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarEdicao} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Atribuir Profissional */}
      <Dialog open={modalAtribuirAberto} onOpenChange={setModalAtribuirAberto}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Atribuir Cliente a Profissional</DialogTitle>
            <DialogDescription className="text-gray-600">
              {clienteAtribuindo && `Atribuir ${clienteAtribuindo.nome} a um profissional`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profissional" className="text-gray-900">
                Profissional *
              </Label>
              <Select
                value={profissionalSelecionado || undefined}
                onValueChange={(value) => setProfissionalSelecionado(value || "")}
              >
                <SelectTrigger id="profissional" className="bg-white text-gray-900 border-gray-300">
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.length > 0 ? (
                    profissionais.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-professionals" disabled>Nenhum profissional disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Este cliente será atribuído ao profissional selecionado. Qualquer atribuição anterior será desativada.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalAtribuirAberto(false);
                setClienteAtribuindo(null);
                setProfissionalSelecionado("");
              }}
              disabled={atribuindo}
              className="text-gray-900 border-gray-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarAtribuicao} 
              disabled={atribuindo || !profissionalSelecionado}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {atribuindo ? "Atribuindo..." : "Atribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







