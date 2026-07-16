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

// Busca no formulário do Meta o primeiro campo cuja chave casa com o regex.
// Retorna null (em vez de um texto genérico) pra usar como valor inicial de
// input — assim o campo fica vazio quando não há dado, sem "Novo lead".
function valorFormulario(dadosFormulario: unknown, regex: RegExp): string | null {
  if (!dadosFormulario || typeof dadosFormulario !== "object") return null;
  const campos = dadosFormulario as Record<string, string>;
  const chave = Object.keys(campos).find((k) => regex.test(k));
  return chave && campos[chave] ? campos[chave] : null;
}

export function nomeFormulario(dadosFormulario: unknown): string | null {
  return valorFormulario(dadosFormulario, /(full_?name|nome|name)/i);
}

export function emailFormulario(dadosFormulario: unknown): string | null {
  return valorFormulario(dadosFormulario, /e-?mail/i);
}

export function telefoneFormulario(dadosFormulario: unknown): string | null {
  return valorFormulario(dadosFormulario, /(phone|telefone|whats)/i);
}

export function procedimentoFormulario(dadosFormulario: unknown): string | null {
  return valorFormulario(dadosFormulario, /procedimento/i);
}

export function faturamentoFormulario(dadosFormulario: unknown): string | null {
  return valorFormulario(dadosFormulario, /faturamento/i);
}

// Deixa o valor do formulário mais legível: as respostas de múltipla escolha do
// Meta vêm com "_" no lugar de espaço (ex: "até_r$15_mil_mensal"). Sem valor,
// mostra "—" pra manter o alinhamento da mensagem.
function limparValor(valor: string | null): string {
  if (!valor || !valor.trim()) return "—";
  return valor.replace(/_/g, " ").trim();
}

// Monta a mensagem de "lead novo" enviada no WhatsApp, com os campos do
// formulário do Meta organizados.
export function mensagemNovoLeadWhatsapp(lead: {
  nome?: string | null;
  dadosFormulario?: unknown;
}): string {
  const d = lead.dadosFormulario;
  return [
    "Novo Lead Cadastrado ✅🦷",
    "",
    `Nome: ${limparValor(nomeExibicaoLead(lead))}`,
    `Email: ${limparValor(emailFormulario(d))}`,
    `Numero: ${limparValor(telefoneFormulario(d))}`,
    `Procedimento foco: ${limparValor(procedimentoFormulario(d))}`,
    `Faturamento: ${limparValor(faturamentoFormulario(d))}`,
  ].join("\n");
}
