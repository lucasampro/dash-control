// Preferência do usuário (persistida em cookie) para exibir ou não a
// variação percentual vs. mês anterior nos KPIs principais do Dashboard.
import { cookies } from "next/headers";

export const COMPARAR_COOKIE = "compararMesAnterior";

/** Por padrão a comparação fica ligada. */
export async function getCompararMesAnterior() {
  const store = await cookies();
  const valor = store.get(COMPARAR_COOKIE)?.value;
  return valor !== "0";
}
