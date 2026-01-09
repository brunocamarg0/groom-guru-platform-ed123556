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
import { Star, MessageSquare } from "lucide-react";

export default function AvaliacoesReputacao() {
  const { avaliacoes, responderAvaliacao } = useDono();

  const notaMedia = avaliacoes.length > 0
    ? avaliacoes.reduce((sum, a) => sum + (a.notaProfissional + a.notaAtendimento + a.notaAmbiente) / 3, 0) / avaliacoes.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Avaliações & Reputação</h2>
        <p className="text-muted-foreground">
          Gerencie avaliações e comentários dos clientes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nota Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notaMedia.toFixed(1)}</div>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <p className="text-xs text-muted-foreground">
                {avaliacoes.length} avaliações
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avaliações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avaliacoes.filter((a) => !a.resposta).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avaliacoes.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {avaliacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma avaliação ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {avaliacoes.map((avaliacao) => (
                  <TableRow key={avaliacao.id}>
                    <TableCell className="font-medium">{avaliacao.clienteNome}</TableCell>
                    <TableCell>{avaliacao.profissionalNome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>
                          {((avaliacao.notaProfissional + avaliacao.notaAtendimento + avaliacao.notaAmbiente) / 3).toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {avaliacao.comentario ? (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="text-sm">{avaliacao.comentario.substring(0, 30)}...</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(avaliacao.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {!avaliacao.resposta && (
                        <Button variant="outline" size="sm">
                          Responder
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



