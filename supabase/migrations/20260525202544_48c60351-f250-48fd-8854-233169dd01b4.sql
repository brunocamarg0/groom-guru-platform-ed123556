-- 1) Restrict produtos SELECT to owners only (was public)
DROP POLICY IF EXISTS "Produtos visíveis publicamente" ON public.produtos;

CREATE POLICY "Dono vê produtos da sua barbearia"
ON public.produtos
FOR SELECT
USING (
  barbearia_id = public.get_user_barbearia_id(auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2) Tighten solicitacoes_cadastro INSERT validation
DROP POLICY IF EXISTS "Qualquer um pode criar solicitação" ON public.solicitacoes_cadastro;

CREATE POLICY "Qualquer um pode criar solicitação"
ON public.solicitacoes_cadastro
FOR INSERT
WITH CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND char_length(email) <= 255
  AND length(regexp_replace(COALESCE(cnpj_cpf, ''), '\D', '', 'g')) IN (11, 14)
  AND char_length(COALESCE(nome, '')) BETWEEN 2 AND 200
  AND char_length(COALESCE(responsavel, '')) BETWEEN 2 AND 200
);