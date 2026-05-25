
-- 1) Recreate public views as SECURITY INVOKER (fix SECURITY DEFINER view warning)
ALTER VIEW public.profissionais_publicos SET (security_invoker = true);
ALTER VIEW public.barbearias_publicas SET (security_invoker = true);

-- 2) Allow barbershop owners and professionals to read clientes related to their barbearia
--    (via agendamentos link or cliente_profissional link)
CREATE POLICY "Dono e profissional veem clientes da barbearia"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.cliente_id = clientes.id
      AND a.barbearia_id = public.get_user_barbearia_id(auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.cliente_profissional cp
    JOIN public.profissionais p ON p.id = cp.profissional_id
    WHERE cp.cliente_id = clientes.id
      AND (
        p.barbearia_id = public.get_user_barbearia_id(auth.uid())
        OR p.user_id = auth.uid()
      )
  )
);

-- 3) Tighten INSERT on agendamento_profissional: must be authenticated AND owner of the
--    barbearia, the linked professional themselves, or super_admin.
DROP POLICY IF EXISTS "Vínculo criado com agendamento válido" ON public.agendamento_profissional;

CREATE POLICY "Vínculo criado por dono ou profissional"
ON public.agendamento_profissional
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.agendamentos a
    JOIN public.profissionais p ON p.barbearia_id = a.barbearia_id
    WHERE a.id = agendamento_profissional.agendamento_id
      AND p.id = agendamento_profissional.profissional_id
      AND (
        a.barbearia_id = public.get_user_barbearia_id(auth.uid())
        OR p.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      )
  )
);
