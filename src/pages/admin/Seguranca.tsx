import { useSeguranca } from "@/context/SegurancaContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Shield, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Seguranca() {
  const { logsAcesso, acoesCriticas, backups, exportacoesLGPD, criarBackup, solicitarExportacaoLGPD } =
    useSeguranca();
  const { toast } = useToast();

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR");
  };

  const formatarTamanho = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Segurança & Compliance</h2>
        <p className="text-muted-foreground">
          Logs de acesso, ações críticas e conformidade LGPD
        </p>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs de Acesso</TabsTrigger>
          <TabsTrigger value="acoes">Ações Críticas</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Acesso</CardTitle>
              <CardDescription>Histórico de acessos ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsAcesso.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.usuarioNome}</TableCell>
                      <TableCell>{log.acao}</TableCell>
                      <TableCell>{log.recurso}</TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>{formatarData(log.data)}</TableCell>
                      <TableCell>
                        <Badge variant={log.sucesso ? "default" : "destructive"}>
                          {log.sucesso ? "Sucesso" : "Falha"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acoes">
          <Card>
            <CardHeader>
              <CardTitle>Ações Críticas</CardTitle>
              <CardDescription>Histórico de ações críticas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acoesCriticas.map((acao) => (
                    <TableRow key={acao.id}>
                      <TableCell>{acao.usuarioNome}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{acao.tipo}</Badge>
                      </TableCell>
                      <TableCell>{acao.descricao}</TableCell>
                      <TableCell>{formatarData(acao.data)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backups</CardTitle>
                  <CardDescription>Backups do sistema</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      criarBackup("incremental");
                      toast({ title: "Backup incremental iniciado" });
                    }}
                  >
                    Backup Incremental
                  </Button>
                  <Button
                    onClick={() => {
                      criarBackup("completo");
                      toast({ title: "Backup completo iniciado" });
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Backup Completo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Badge variant="secondary">{backup.tipo}</Badge>
                      </TableCell>
                      <TableCell>{formatarData(backup.data)}</TableCell>
                      <TableCell>{formatarTamanho(backup.tamanho)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            backup.status === "sucesso"
                              ? "default"
                              : backup.status === "falha"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {backup.status === "sucesso" && (
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lgpd">
          <Card>
            <CardHeader>
              <CardTitle>LGPD - Exportações e Exclusões</CardTitle>
              <CardDescription>
                Gerencie solicitações de exportação e exclusão de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exportacoesLGPD.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma solicitação LGPD
                  </p>
                ) : (
                  exportacoesLGPD.map((exp) => (
                    <div key={exp.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {exp.tipo === "exportar" ? "Exportação" : "Exclusão"} - Barbearia {exp.barbeariaId}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatarData(exp.dataSolicitacao)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            exp.status === "concluido"
                              ? "default"
                              : exp.status === "falhou"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {exp.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



