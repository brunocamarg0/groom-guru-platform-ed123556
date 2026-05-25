-- Função SECURITY DEFINER para validar existência de barbearia + serviço sem ser bloqueada por RLS
CREATE OR REPLACE FUNCTION public.validar_agendamento_input(_barbearia_id uuid, _servico_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.servicos s
    JOIN public.barbearias b ON b.id = s.barbearia_id
    WHERE s.id = _servico_id
      AND s.barbearia_id = _barbearia_id
  );
$$;

DROP POLICY IF EXISTS "Qualquer um pode criar agendamento" ON public.agendamentos;

CREATE POLICY "Qualquer um pode criar agendamento"
ON public.agendamentos
FOR INSERT
TO public
WITH CHECK (public.validar_agendamento_input(barbearia_id, servico_id));
