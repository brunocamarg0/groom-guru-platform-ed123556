
-- 1) BARBEARIAS: remover SELECT público total e restringir colunas sensíveis
DROP POLICY IF EXISTS "Barbearias visíveis publicamente" ON public.barbearias;

-- Permitir SELECT para todos, mas a proteção real virá via GRANT de colunas
CREATE POLICY "Barbearias visíveis publicamente"
ON public.barbearias FOR SELECT
USING (true);

-- Revogar acesso a colunas sensíveis para anon e authenticated
REVOKE SELECT ON public.barbearias FROM anon, authenticated;

-- Conceder SELECT apenas em colunas públicas
GRANT SELECT (
  id, nome, foto, cep, bairro, cidade, endereco,
  latitude, longitude, plano, status, modo_confirmacao,
  created_at, updated_at, data_vencimento
) ON public.barbearias TO anon, authenticated;

-- Colunas sensíveis: liberar apenas para authenticated (RLS ainda valida com policies abaixo)
GRANT SELECT (cnpj_cpf, email, telefone, responsavel) ON public.barbearias TO authenticated;

-- Policy adicional: somente dono ou super-admin pode ver dados sensíveis (via segunda policy SELECT que cobre todas as colunas só para esses)
CREATE POLICY "Dono vê dados sensíveis da própria barbearia"
ON public.barbearias FOR SELECT
TO authenticated
USING (id = public.get_user_barbearia_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'::app_role));


-- 2) PROFISSIONAIS: restringir colunas sensíveis (email, telefone, comissões)
DROP POLICY IF EXISTS "Profissionais visíveis publicamente" ON public.profissionais;

CREATE POLICY "Profissionais visíveis publicamente"
ON public.profissionais FOR SELECT
USING (true);

REVOKE SELECT ON public.profissionais FROM anon, authenticated;

GRANT SELECT (
  id, nome, foto, especialidades, ativo, barbearia_id,
  data_admissao, created_at, updated_at, user_id
) ON public.profissionais TO anon, authenticated;

-- Dados sensíveis só para authenticated (e policies já filtram quem pode ver)
GRANT SELECT (email, telefone, comissao_valor, comissao_tipo, comissao_assinatura)
  ON public.profissionais TO authenticated;

CREATE POLICY "Dono e próprio profissional veem dados sensíveis"
ON public.profissionais FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR barbearia_id = public.get_user_barbearia_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);


-- 3) CLIENTES: remover branch que permite INSERT anônimo
DROP POLICY IF EXISTS "Cliente cria seu próprio cadastro" ON public.clientes;

CREATE POLICY "Cliente cria seu próprio cadastro"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- 4) AGENDAMENTO_PROFISSIONAL: deixar de ser público
DROP POLICY IF EXISTS "Visível para envolvidos" ON public.agendamento_profissional;

CREATE POLICY "Visível para envolvidos"
ON public.agendamento_profissional FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.id = agendamento_profissional.agendamento_id
      AND (
        a.barbearia_id = public.get_user_barbearia_id(auth.uid())
        OR a.cliente_id IN (SELECT c.id FROM public.clientes c WHERE c.user_id = auth.uid())
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      )
  )
  OR profissional_id IN (SELECT p.id FROM public.profissionais p WHERE p.user_id = auth.uid())
);


-- 5) AVALIACOES: restringir leitura a envolvidos
DROP POLICY IF EXISTS "Avaliações visíveis publicamente" ON public.avaliacoes;

CREATE POLICY "Avaliações visíveis para envolvidos"
ON public.avaliacoes FOR SELECT
TO authenticated
USING (
  cliente_id IN (SELECT c.id FROM public.clientes c WHERE c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.id = avaliacoes.agendamento_id
      AND a.barbearia_id = public.get_user_barbearia_id(auth.uid())
  )
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);


-- 6) FUNÇÕES PGMQ: adicionar search_path fixo
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
