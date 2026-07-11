// Mês de referência compartilhado entre as páginas do painel (Dashboard,
// Leads, Criativos, Investimento, Financeiro). Selecionar o mês em uma
// página propaga automaticamente para as demais via cookie.
import { cookies } from "next/headers";

export const MES_COOKIE = "mesReferencia";

export function mesAtual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Prioriza `override` (query param explícito), depois o cookie compartilhado, depois o mês atual. */
export async function getMesReferencia(override?: string) {
  if (override) return override;
  const store = await cookies();
  return store.get(MES_COOKIE)?.value || mesAtual();
}
