// Extrai um nome legível do lead a partir das respostas do formulário nativo
// do Meta (dadosFormulario), que vêm com chaves variáveis dependendo do form.
// Tenta nome → e-mail → telefone, e cai pra um texto genérico se não achar.
export function nomeDoLead(dadosFormulario: unknown): string {
  if (!dadosFormulario || typeof dadosFormulario !== "object") return "Novo lead";
  const campos = dadosFormulario as Record<string, string>;

  const chaveNome = Object.keys(campos).find((k) =>
    /(full_?name|nome|name)/i.test(k),
  );
  if (chaveNome && campos[chaveNome]) return campos[chaveNome];

  const chaveEmail = Object.keys(campos).find((k) => /e-?mail/i.test(k));
  if (chaveEmail && campos[chaveEmail]) return campos[chaveEmail];

  const chaveTel = Object.keys(campos).find((k) => /(phone|telefone|whats)/i.test(k));
  if (chaveTel && campos[chaveTel]) return campos[chaveTel];

  return "Novo lead";
}

// Nome de exibição do lead: prioriza o nome digitado manualmente e, se não
// houver, cai pro que veio do formulário do Meta.
export function nomeExibicaoLead(lead: {
  nome?: string | null;
  dadosFormulario?: unknown;
}): string {
  if (lead.nome && lead.nome.trim()) return lead.nome.trim();
  return nomeDoLead(lead.dadosFormulario);
}
