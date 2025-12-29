import { useState } from "react";
import { usePlanos } from "@/context/PlanosContext";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusAssinatura } from "@/types/plano";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusConfig: Record<
  StatusAssinatura,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  em_dia: { label: "Em Dia", variant: "default" },
  atrasado: { label: "Atrasado", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
  vencido: { label: "Vencido", variant: "destructive" },
};

export default function Assinaturas() {
  const { assinaturas, getAssinaturasPorStatus } = usePlanos();
  const [statusFiltro, setStatusFiltro] = useState<StatusAssinatura | "todos">("todos");

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return data;
    }
  };

  const estatisticas = {
    em_dia: getAssinaturasPorStatus("em_dia").length,
    atrasado: getAssinaturasPorStatus("atrasado").length,
    cancelado: getAssinaturasPorStatus("cancelado").length,
    vencido: getAssinaturasPorStatus("vencido").length,
    total: assinaturas.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Assinaturas</h2>
        <p className="text-muted-foreground">
          Gerencie todas as assinaturas e seus status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{estatisticas.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em Dia</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {estatisticas.em_dia}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Atrasado</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {estatisticas.atrasado}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencido</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {estatisticas.vencido}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelado</CardDescription>
            <CardTitle className="text-2xl text-gray-600">
              {estatisticas.cancelado}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinaturas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as assinaturas ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={statusFiltro}
            onValueChange={(value) =>
              setStatusFiltro(value as StatusAssinatura | "todos")
            }
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="em_dia">Em Dia</TabsTrigger>
              <TabsTrigger value="atrasado">Atrasado</TabsTrigger>
              <TabsTrigger value="vencido">Vencido</TabsTrigger>
              <TabsTrigger value="cancelado">Cancelado</TabsTrigger>
            </TabsList>

            {(["todos", "em_dia", "atrasado", "vencido", "cancelado"] as const).map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barbearia</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Próximo Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tabValue === "todos" ? assinaturas : getAssinaturasPorStatus(tabValue as StatusAssinatura)).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          Nenhuma assinatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      (tabValue === "todos" ? assinaturas : getAssinaturasPorStatus(tabValue as StatusAssinatura)).map((assinatura) => (
                        <TableRow key={assinatura.id}>
                          <TableCell className="font-medium">
                            {assinatura.barbeariaNome}
                          </TableCell>
                          <TableCell>{assinatura.planoNome}</TableCell>
                          <TableCell>
                            {formatarMoeda(assinatura.valorMensal)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatarData(assinatura.proximoVencimento)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusConfig[assinatura.status].variant}
                            >
                              {statusConfig[assinatura.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/admin/assinaturas/${assinatura.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

