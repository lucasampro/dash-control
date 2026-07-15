"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Atualiza a página automaticamente em intervalos, sem precisar de F5 manual.
 * Usado nas páginas que mostram dados de Leads pra refletir novos leads
 * recebidos pelo webhook do Meta assim que eles entram no banco.
 *
 * Quando `syncAction` é passada (Server Action de sincronização com o Meta),
 * ela é chamada antes de cada refresh — assim, enquanto a página estiver
 * aberta, os leads novos são puxados automaticamente sem precisar clicar em
 * "Sincronizar" (funciona mesmo se o webhook do Meta não disparar).
 */
export function AutoRefresh({
  intervalMs = 30000,
  syncAction,
}: {
  intervalMs?: number;
  syncAction?: () => Promise<unknown>;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        Promise.resolve(syncAction?.())
          .catch(() => {})
          .finally(() => router.refresh());
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, syncAction]);

  return null;
}
