import { useState } from "react";
import { useSuporte } from "@/context/SuporteContext";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Clock } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusTicket, PrioridadeTicket } from "@/types/suporte";
import { useToast } from "@/hooks/use-toast";

export default function Suporte() {
  const { tickets, criarTicket, atualizarTicket } = useSuporte();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    barbeariaId: "",
    titulo: "",
    descricao: "",
    prioridade: "media" as PrioridadeTicket,
    categoria: "",
  });

  const handleCriarTicket = () => {
    if (!formData.titulo || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Preencha título e descrição.",
        variant: "destructive",
      });
      return;
    }

    criarTicket({
      barbeariaId: formData.barbeariaId || "1",
      barbeariaNome: "Barbearia",
      ...formData,
      criadoPor: "Sistema",
      status: "aberto",
    });

    toast({
      title: "Ticket criado",
      description: "Ticket de suporte criado com sucesso.",
    });
    setIsDialogOpen(false);
  };

  const statusConfig = {
    aberto: { label: "Aberto", variant: "default" as const },
    em_andamento: { label: "Em Andamento", variant: "secondary" as const },
    aguardando_cliente: { label: "Aguardando Cliente", variant: "outline" as const },
    resolvido: { label: "Resolvido", variant: "default" as const },
    fechado: { label: "Fechado", variant: "secondary" as const },
  };

  const prioridadeConfig = {
    baixa: { label: "Baixa", variant: "secondary" as const },
    media: { label: "Média", variant: "default" as const },
    alta: { label: "Alta", variant: "destructive" as const },
    urgente: { label: "Urgente", variant: "destructive" as const },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suporte & Atendimento</h2>
          <p className="text-muted-foreground">
            Gerencie tickets de suporte e SLA
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Ticket de Suporte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(value: PrioridadeTicket) =>
                    setFormData({ ...formData, prioridade: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarTicket}>Criar Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets de Suporte</CardTitle>
          <CardDescription>Lista de todos os tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Barbearia</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status];
                const prioridade = prioridadeConfig[ticket.prioridade];
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">#{ticket.id}</TableCell>
                    <TableCell>{ticket.barbeariaNome}</TableCell>
                    <TableCell>{ticket.titulo}</TableCell>
                    <TableCell>
                      <Badge variant={prioridade.variant}>{prioridade.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {ticket.sla.tempoDecorrido}h / {ticket.sla.tempoLimite}h
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}



