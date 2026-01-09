import { useDono } from "@/context/DonoContext";
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
import { Bell, MessageCircle, Mail, Smartphone } from "lucide-react";

export default function ComunicacaoNotificacoes() {
  const { notificacoes, marcarNotificacaoLida } = useDono();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Comunicação & Notificações</h2>
        <p className="text-muted-foreground">
          Gerencie mensagens automáticas e notificações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notificações Não Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificacoes.filter((n) => !n.lida).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificacoes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Conectado</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {notificacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma notificação
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificacoes.map((notificacao) => (
                  <TableRow key={notificacao.id}>
                    <TableCell>
                      <Badge variant="outline">{notificacao.tipo}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{notificacao.titulo}</TableCell>
                    <TableCell>{notificacao.mensagem}</TableCell>
                    <TableCell>
                      {new Date(notificacao.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={notificacao.lida ? "secondary" : "default"}>
                        {notificacao.lida ? "Lida" : "Não lida"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => marcarNotificacaoLida(notificacao.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



