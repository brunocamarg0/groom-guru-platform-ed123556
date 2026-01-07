import { useState } from "react";
import { useBarbearias } from "@/context/BarbeariasContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Eye, Edit, Power, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBarbearia } from "@/types/barbearia";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<StatusBarbearia, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativa: { label: "Ativa", variant: "default" },
  em_teste: { label: "Em Teste", variant: "secondary" },
  bloqueada: { label: "Bloqueada", variant: "destructive" },
  cancelada: { label: "Cancelada", variant: "outline" },
};

const planoConfig: Record<string, string> = {
  basico: "Básico",
  premium: "Premium",
  enterprise: "Enterprise",
};

export default function AdminDashboard() {
  const { barbearias, alterarStatus, suspenderPorInadimplencia } = useBarbearias();
  const { toast } = useToast();

  const handleAlterarStatus = (id: string, status: StatusBarbearia) => {
    alterarStatus(id, status);
    toast({
      title: "Status alterado",
      description: `Barbearia ${statusConfig[status].label.toLowerCase()} com sucesso.`,
    });
  };

  const handleSuspender = (id: string) => {
    suspenderPorInadimplencia(id);
    toast({
      title: "Barbearia suspensa",
      description: "Barbearia bloqueada por inadimplência.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Barbearias</h2>
          <p className="text-muted-foreground">
            Gerencie todas as barbearias cadastradas no sistema
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/barbearias/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Barbearia
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ/CPF</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {barbearias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma barbearia cadastrada
                </TableCell>
              </TableRow>
            ) : (
              barbearias.map((barbearia) => (
                <TableRow key={barbearia.id}>
                  <TableCell className="font-medium">{barbearia.nome}</TableCell>
                  <TableCell>{barbearia.cnpjCpf}</TableCell>
                  <TableCell>{barbearia.responsavel}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{planoConfig[barbearia.plano]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[barbearia.status].variant}>
                      {statusConfig[barbearia.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(barbearia.dataVencimento).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {barbearia.gatewayPagamento.conectado ? (
                      <Badge variant="default" className="bg-green-500">
                        {barbearia.gatewayPagamento.nome}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Não conectado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/barbearias/${barbearia.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/barbearias/${barbearia.id}/editar`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleAlterarStatus(barbearia.id, "ativa")}
                          disabled={barbearia.status === "ativa"}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          Ativar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAlterarStatus(barbearia.id, "em_teste")}
                          disabled={barbearia.status === "em_teste"}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          Colocar em Teste
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAlterarStatus(barbearia.id, "bloqueada")}
                          disabled={barbearia.status === "bloqueada"}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Bloquear
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAlterarStatus(barbearia.id, "cancelada")}
                          disabled={barbearia.status === "cancelada"}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleSuspender(barbearia.id)}
                          className="text-destructive"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Suspender por Inadimplência
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

