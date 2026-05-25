
CREATE OR REPLACE FUNCTION public.is_cliente_da_minha_barbearia(_cliente_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.cliente_id = _cliente_id
      AND a.barbearia_id = public.get_user_barbearia_id(_user_id)
  ) OR EXISTS (
    SELECT 1 FROM public.cliente_profissional cp
    JOIN public.profissionais p ON p.id = cp.profissional_id
    WHERE cp.cliente_id = _cliente_id
      AND (p.barbearia_id = public.get_user_barbearia_id(_user_id) OR p.user_id = _user_id)
  );
$$;

DROP POLICY IF EXISTS "Dono e profissional veem clientes da barbearia" ON public.clientes;

CREATE POLICY "Dono e profissional veem clientes da barbearia"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.is_cliente_da_minha_barbearia(id, auth.uid()));
