"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MES_COOKIE } from "@/lib/mesReferencia";
import { COMPARAR_COOKIE } from "@/lib/compararMes";

/** Persiste o mês de referência selecionado e redireciona mantendo a URL compartilhável. */
export async function setMesReferencia(formData: FormData) {
  const mes = String(formData.get("mes") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (mes) {
    const store = await cookies();
    store.set(MES_COOKIE, mes, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  redirect(mes ? `${redirectTo}?mes=${mes}` : redirectTo);
}

/** Liga/desliga a comparação com o mês anterior nos KPIs do Dashboard. */
export async function setCompararMesAnterior(formData: FormData) {
  const ativo = formData.get("ativo") === "1";
  const mes = String(formData.get("mes") ?? "");

  const store = await cookies();
  store.set(COMPARAR_COOKIE, ativo ? "1" : "0", { path: "/", maxAge: 60 * 60 * 24 * 365 });

  redirect(mes ? `/dashboard?mes=${mes}` : "/dashboard");
}
