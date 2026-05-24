
-- Tighten agendamento_profissional owner ALL
DROP POLICY IF EXISTS "Dono gerencia vínculos da sua barbearia" ON public.agendamento_profissional;
CREATE POLICY "Dono gerencia vínculos da sua barbearia"
ON public.agendamento_profissional
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.agendamentos a
          WHERE a.id = agendamento_profissional.agendamento_id
            AND (a.barbearia_id = get_user_barbearia_id(auth.uid())
                 OR has_role(auth.uid(), 'super_admin'::app_role)))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.agendamentos a
          WHERE a.id = agendamento_profissional.agendamento_id
            AND (a.barbearia_id = get_user_barbearia_id(auth.uid())
                 OR has_role(auth.uid(), 'super_admin'::app_role)))
);

-- Tighten agendamentos public INSERT: must reference a real barbearia and matching servico
DROP POLICY IF EXISTS "Qualquer um pode criar agendamento" ON public.agendamentos;
CREATE POLICY "Qualquer um pode criar agendamento"
ON public.agendamentos
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.barbearias b WHERE b.id = agendamentos.barbearia_id)
  AND EXISTS (SELECT 1 FROM public.servicos s WHERE s.id = agendamentos.servico_id AND s.barbearia_id = agendamentos.barbearia_id)
);

-- Tighten solicitacoes_cadastro INSERT (basic field presence)
DROP POLICY IF EXISTS "Qualquer um pode criar solicitação" ON public.solicitacoes_cadastro;
CREATE POLICY "Qualquer um pode criar solicitação"
ON public.solicitacoes_cadastro
FOR INSERT
WITH CHECK (char_length(coalesce(email,'')) > 3 AND char_length(coalesce(cnpj_cpf,'')) > 0);

-- Tighten tickets_suporte INSERT
DROP POLICY IF EXISTS "Qualquer um pode abrir ticket" ON public.tickets_suporte;
CREATE POLICY "Qualquer um pode abrir ticket"
ON public.tickets_suporte
FOR INSERT
WITH CHECK (char_length(coalesce(assunto,'')) > 0);

-- Restrict EXECUTE on internal helper SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_barbearia_id(uuid) FROM PUBLIC, anon, authenticated;
