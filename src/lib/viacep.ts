// Helpers para integração com ViaCEP (https://viacep.com.br)

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Formata "12345678" -> "12345-678" */
export function formatarCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Busca endereço no ViaCEP. Retorna null se inválido ou não encontrado. */
export async function buscarCep(cep: string): Promise<EnderecoViaCep | null> {
  const limpo = cep.replace(/\D/g, "");
  if (limpo.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.erro) return null;
    return {
      cep: formatarCep(limpo),
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
