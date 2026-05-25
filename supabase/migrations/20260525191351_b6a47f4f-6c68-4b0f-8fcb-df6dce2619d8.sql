CREATE OR REPLACE FUNCTION public.get_profissionais_publicos_by_barbearia(_barbearia_ids uuid[])
RETURNS TABLE(id uuid, nome text, foto text, especialidades text[], ativo boolean, barbearia_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nome, p.foto, p.especialidades, p.ativo, p.barbearia_id
  FROM public.profissionais p
  WHERE p.barbearia_id = ANY(_barbearia_ids)
    AND p.ativo = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_profissionais_publicos_by_barbearia(uuid[]) TO anon, authenticated;