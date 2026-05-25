## Objetivo
Garantir que cada item do menu do **Painel do Dono** (16 itens) e do **Painel do Cliente** (12 itens) esteja totalmente funcional, conectado ao Lovable Cloud (Postgres + Edge Functions), sem depender do backend antigo do Railway nem de dados mockados.

## Estratégia
Começar pelo **Painel do Dono** primeiro. Motivo: ele é a fonte da maior parte dos dados (serviços, profissionais, planos, promoções, configurações) que o painel do Cliente consome. Validando o Dono primeiro, o Cliente fica muito mais fácil de fechar depois.

Trabalho em **fases pequenas e verificáveis**, uma área por vez. Para cada área eu vou:
1. Ler a página + contexto + tabela no banco
2. Substituir chamadas ao backend antigo / mocks por queries Supabase + RLS
3. Testar CRUD básico no preview (criar, listar, editar, excluir)
4. Marcar como concluída e seguir

---

## FASE 1 — Painel do Dono

### 1.1 Já funcionais (apenas auditoria rápida)
- Dashboard (KPIs)
- Profissionais
- Clientes
- Serviços

Verificar se ainda passam dos dados certos após mudanças recentes.

### 1.2 Áreas a corrigir
- **Agenda Inteligente** — confirmar uso de `servicos` do `DonoContext` e CRUD em `agendamentos`
- **Configurações** — salvar dados da barbearia, horários e política em `barbearias`
- **Financeiro** — migrar de mock para queries em `pagamentos` + `agendamentos`
- **Comissões** — ler `comissoes_pagas` / `comissoes_assinatura`
- **Fidelidade/Promoções** — CRUD em `promocoes`
- **Avaliações** — listar `avaliacoes` + responder
- **Produtos/Estoque** — CRUD em `produtos`
- **Notificações** — listar `notificacoes` + marcar lida
- **Planos de Clientes** — CRUD em `planos_cliente`
- **Assinaturas Cliente** — listar `assinaturas_cliente`
- **Minha Assinatura** — ler `assinaturas` + `faturas` da barbearia
- **Relatórios** — gerar com base em dados reais (agendamentos, pagamentos)

---

## FASE 2 — Painel do Cliente

- **Dashboard** — próximo agendamento, KPIs do cliente
- **Buscar Barbearias** — query em `barbearias` (sem Google Maps)
- **Agendamento Online** — criar em `agendamentos` respeitando horários ocupados
- **Pagamentos** — listar `pagamentos` do cliente + integração Mercado Pago via Edge Function
- **Histórico** — agendamentos concluídos/cancelados
- **Avaliações** — criar em `avaliacoes`
- **Perfil** — atualizar `clientes` + `profiles`
- **Notificações** — listar/marcar lida
- **Fidelidade** — pontos calculados a partir de agendamentos concluídos
- **Planos Disponíveis** — listar `planos_cliente`
- **Minha Assinatura** — ler `assinaturas_cliente` + `pagamentos_assinatura`
- **Suporte** — criar em `tickets_suporte`
- **Configurações** — preferências + alterar senha via Supabase Auth

---

## Detalhes técnicos
- Todas as queries usam o cliente `@/integrations/supabase/client` já configurado
- Isolamento por barbearia via `get_user_barbearia_id(auth.uid())` nas RLS (já existe)
- Real-time onde fizer sentido (agendamentos, notificações) via `supabase.channel`
- Pagamentos Mercado Pago continuam via Edge Functions (`signup-dono` já existe; criar outras se preciso)
- Nada de chamadas para `backend/` (Railway) ou `api/` (Vercel) — esses serão deprecados
- Padrão de datas: `T12:00:00.000Z` (regra do projeto)

## Entregáveis por checkpoint
A cada 3–4 áreas concluídas vou parar, te avisar o que foi validado e pedir para você testar antes de seguir. Assim você consegue acompanhar e não fica uma entrega gigante de uma vez só.

## Ordem de execução
1. Auditoria rápida das 4 áreas já funcionais do Dono
2. Configurações + Agenda + Financeiro + Comissões (Dono)
3. Fidelidade + Avaliações + Produtos + Notificações (Dono)
4. Planos + Assinaturas Cliente + Minha Assinatura + Relatórios (Dono)
5. Dashboard + Buscar + Agendamento + Pagamentos (Cliente)
6. Histórico + Avaliações + Perfil + Notificações (Cliente)
7. Fidelidade + Planos + Assinatura + Suporte + Config (Cliente)