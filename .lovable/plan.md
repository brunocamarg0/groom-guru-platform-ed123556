
# Painel do Cliente — Plano de Correções

Vou agrupar tudo em 4 frentes para conseguir entregar de forma organizada (e reversível, se algo não agradar).

---

## Frente 1 — Tema claro (textos transparentes em TODO o painel)

**Causa raiz:** o `ClienteLayout` força `className="light bg-white"`, mas as páginas internas usam tokens (`text-foreground`, `text-muted-foreground`, títulos sem cor explícita) que herdam o tema escuro global do app. Por isso quase tudo aparece "transparente/claro demais".

**O que farei:**
- Definir um escopo CSS isolado em `index.css` para `#cliente-panel` que sobrescreve as variáveis HSL (`--background`, `--foreground`, `--card`, `--muted-foreground`, `--border`, `--sidebar-*`) com paleta clara consistente.
- Remover as gambiarras `text-gray-900 dark:text-gray-100` espalhadas no `ClienteLayout` (vão deixar de ser necessárias).
- Garantir contraste correto nos títulos: "Olá, fulano", "Histórico de Agendamentos", "Pagamento", "Avaliar Atendimento", "Perfil", "Notificações", "Fidelidade & Benefícios", "Planos Disponíveis", "Minha Assinatura", "Suporte & Contato", "Configurações" e no botão hamburger (`SidebarTrigger`).

Resultado: todo texto, ícone do menu, dialog de "Detalhes do Agendamento" e cabeçalhos ficam legíveis sem precisar tocar em cada página.

---

## Frente 2 — Bugs funcionais

1. **Botão "Atualizar" do Dashboard sem efeito** → trocar para invalidar queries do React Query corretamente e mostrar toast "Atualizado".
2. **Cancelar agendamento não cancela** → investigar (provável conflito de RLS update / status). Depois do cancelamento:
   - status vira `cancelado` (libera o slot automaticamente, pois `get_horarios_ocupados` já ignora cancelados).
   - cria notificação para o dono da barbearia (`agendamento_cancelado`).
3. **"Reagendar"** → ao clicar, abrir o fluxo de agendamento já com a barbearia/serviço pré-preenchidos e cancelar o agendamento original assim que o novo for confirmado (assim o slot antigo desocupa e o cliente escolhe outro horário).
4. **Pagar → "duplicate key value violates unique constraint pagamentos_agendamento_id_key"** → existe constraint unique por `agendamento_id`. Ajustar `criarPagamento` para fazer **upsert** (ou reaproveitar pagamento existente em status `pendente`/`processando`).

---

## Frente 3 — Novas features pedidas

5. **Confirmação de atendimento + Avaliação pelo cliente**
   - Dono marca agendamento como `concluido` (já existe no painel do dono).
   - No painel do cliente, agendamentos `concluido` sem avaliação ganham botão "Avaliar atendimento" → abre modal e salva em `avaliacoes` (tabela já existe com RLS pronto).
6. **Suporte → botão WhatsApp** abre `https://wa.me/5519989482441` em nova aba.
7. **Suporte → "Enviar Mensagem"** → encaminhar para `brunocamargocontato@hotmail.com` via edge function `send-transactional-email` (template novo: `suporte-cliente`), além de gravar em `tickets_suporte`.
8. **Notificações** (item do menu) → explicar/realizar a função: lista as notificações que o cliente recebe (confirmações, lembretes, cancelamentos, promoções). Vou criar a tabela `notificacoes_cliente` (espelhando o que já existe para o dono) ou reaproveitar `notificacoes` com coluna `cliente_id`. Decisão técnica: **adicionar `cliente_id` em `notificacoes`** + RLS para o cliente ver as suas.

---

## Frente 4 — Configurações: Preferências de Notificação

9. Persistir as 5 toggles (App, Email, WhatsApp, Promoções, Lembretes) em uma nova tabela `cliente_preferencias_notificacao` (1:1 com `clientes`), com RLS própria. Hoje os switches não salvam nada.

---

## Ordem de execução

1. Frente 1 (tema) — desbloqueia visualmente quase tudo.
2. Frente 2 (bugs) — corrige o que está realmente quebrado.
3. Frente 4 (preferências) — pequena migração + UI.
4. Frente 3 (features novas) — maior esforço, faço por último.

---

## Itens técnicos (resumo para o registro)

- Migração 1: `notificacoes.cliente_id uuid null` + policies de SELECT/UPDATE para cliente.
- Migração 2: tabela `cliente_preferencias_notificacao` com grants + RLS.
- Edge function: ajuste em `signup` não é necessário; criar template `suporte-cliente` em `_shared/transactional-email-templates/`.
- Frontend: ajustes em `ClienteLayout`, `ClienteDashboard`, `DetalhesAgendamento` (componente de modal), `Pagamentos`, `SuporteCliente`, `ConfiguracoesCliente`, `NotificacoesCliente`, `Avaliacoes`, `index.css`.
- `ClienteContext.criarPagamento` → upsert por `agendamento_id`.

---

Posso seguir nessa ordem? Se quiser que eu priorize só a Frente 1 (deixar tudo legível) e a Frente 2 (cancelar/pagar funcionando) nesta rodada, e fazer 3+4 depois, me avise — isso entrega valor mais rápido.
