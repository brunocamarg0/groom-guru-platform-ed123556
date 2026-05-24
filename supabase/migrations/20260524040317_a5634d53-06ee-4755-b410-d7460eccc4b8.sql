
-- 1. agendamento_profissional: tighten public INSERT
DROP POLICY IF EXISTS "Qualquer um cria vínculo no agendamento" ON public.agendamento_profissional;
CREATE POLICY "Vínculo criado com agendamento válido"
ON public.agendamento_profissional
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agendamentos a
    JOIN public.profissionais p ON p.barbearia_id = a.barbearia_id
    WHERE a.id = agendamento_profissional.agendamento_id
      AND p.id = agendamento_profissional.profissional_id
  )
);

-- 2. assinaturas_cliente: fix WITH CHECK
DROP POLICY IF EXISTS "Dono gerencia assinaturas dos clientes da sua barbearia" ON public.assinaturas_cliente;
CREATE POLICY "Dono gerencia assinaturas dos clientes da sua barbearia"
ON public.assinaturas_cliente
FOR ALL
USING (
  (EXISTS (SELECT 1 FROM public.planos_cliente pc
           WHERE pc.id = assinaturas_cliente.plano_id
             AND pc.barbearia_id = get_user_barbearia_id(auth.uid())))
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM public.planos_cliente pc
           WHERE pc.id = assinaturas_cliente.plano_id
             AND pc.barbearia_id = get_user_barbearia_id(auth.uid())))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3. cliente_profissional: fix WITH CHECK
DROP POLICY IF EXISTS "Dono gerencia vínculos cliente-profissional" ON public.cliente_profissional;
CREATE POLICY "Dono gerencia vínculos cliente-profissional"
ON public.cliente_profissional
FOR ALL
USING (
  (EXISTS (SELECT 1 FROM public.profissionais p
           WHERE p.id = cliente_profissional.profissional_id
             AND p.barbearia_id = get_user_barbearia_id(auth.uid())))
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM public.profissionais p
           WHERE p.id = cliente_profissional.profissional_id
             AND p.barbearia_id = get_user_barbearia_id(auth.uid())))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 4. pagamentos: fix WITH CHECK
DROP POLICY IF EXISTS "Dono gerencia pagamentos da sua barbearia" ON public.pagamentos;
CREATE POLICY "Dono gerencia pagamentos da sua barbearia"
ON public.pagamentos
FOR ALL
USING (
  (EXISTS (SELECT 1 FROM public.agendamentos a
           WHERE a.id = pagamentos.agendamento_id
             AND a.barbearia_id = get_user_barbearia_id(auth.uid())))
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM public.agendamentos a
           WHERE a.id = pagamentos.agendamento_id
             AND a.barbearia_id = get_user_barbearia_id(auth.uid())))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 5. barbearias: revoke sensitive cols from anon
REVOKE SELECT (cnpj_cpf, email, telefone, responsavel) ON public.barbearias FROM anon;

-- 6. profissionais: revoke sensitive cols from anon
REVOKE SELECT (email, telefone, comissao_tipo, comissao_valor, comissao_assinatura) ON public.profissionais FROM anon;

-- 7. convites: add SELECT policy for barbershop owners
CREATE POLICY "Dono lê convites da sua barbearia"
ON public.convites
FOR SELECT
USING (barbearia_id = get_user_barbearia_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 8. solicitacoes_cadastro: explicit super-admin SELECT
CREATE POLICY "Apenas super-admin lê solicitações"
ON public.solicitacoes_cadastro
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 9. Revoke EXECUTE from anon/authenticated on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.grant_super_admin_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
