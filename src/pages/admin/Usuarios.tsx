import { useState } from "react";
import { useUsuarios } from "@/context/UsuariosContext";
import { useBarbearias } from "@/context/BarbeariasContext";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Key, Ban, CheckCircle, Eye, RefreshCw, Loader2, Users } from "lucide-react";
import { TipoUsuario, StatusUsuario, NovoUsuario } from "@/types/usuario";
import { useToast } from "@/hooks/use-toast";

export default function Usuarios() {
  const { usuarios, isLoading, error, recarregarUsuarios, adicionarUsuario, resetarSenha, bloquearUsuario, desbloquearUsuario } =
    useUsuarios();
  const { barbearias } = useBarbearias();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<NovoUsuario>>({
    barbeariaId: "",
    nome: "",
    email: "",
    tipo: "operador",
    senha: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barbeariaId || !formData.nome || !formData.email || !formData.senha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    adicionarUsuario(formData as NovoUsuario);
    toast({
      title: "Usuário criado",
      description: `${formData.nome} foi criado com sucesso.`,
    });
    setIsDialogOpen(false);
    setFormData({
      barbeariaId: "",
      nome: "",
      email: "",
      tipo: "operador",
      senha: "",
    });
  };

  const formatarData = (data?: string) => {
    if (!data) return "Nunca";
    return new Date(data).toLocaleString("pt-BR");
  };

  // Estatísticas
  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.status === 'ativo').length,
    bloqueados: usuarios.filter(u => u.status === 'bloqueado').length,
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              Donos de barbearias cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.ativos}
            </div>
            <p className="text-xs text-muted-foreground">
              Podem acessar o sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.bloqueados}
            </div>
            <p className="text-xs text-muted-foreground">
              Acesso suspenso
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuários do Sistema</h2>
          <p className="text-muted-foreground">
            Gerencie os administradores e usuários das barbearias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={recarregarUsuarios} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie um novo usuário para uma barbearia
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barbeariaId">Barbearia *</Label>
                  <Select
                    value={formData.barbeariaId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, barbeariaId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma barbearia" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbearias.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome || ""}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: TipoUsuario) =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_barbearia">Admin da Barbearia</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha || ""}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Usuário</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={recarregarUsuarios}>
            Tentar novamente
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Todos os usuários cadastrados no sistema (donos de barbearias)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Barbearia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-muted-foreground">Carregando usuários...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.barbeariaNome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {usuario.tipo === "admin_barbearia"
                        ? "Admin"
                        : usuario.tipo === "gerente"
                        ? "Gerente"
                        : "Operador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {usuario.status === "ativo" ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        Bloqueado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {usuario.dataCriacao ? new Date(usuario.dataCriacao).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          resetarSenha(usuario.id);
                          toast({
                            title: "Senha resetada",
                            description: "Email de reset enviado.",
                          });
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      {usuario.status === "ativo" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            bloquearUsuario(usuario.id);
                            toast({
                              title: "Usuário bloqueado",
                              description: `${usuario.nome} foi bloqueado.`,
                            });
                          }}
                        >
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            desbloquearUsuario(usuario.id);
                            toast({
                              title: "Usuário desbloqueado",
                              description: `${usuario.nome} foi desbloqueado.`,
                            });
                          }}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
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
