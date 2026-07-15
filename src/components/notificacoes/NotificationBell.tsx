"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check, Smartphone } from "lucide-react";
import {
  getNotificacoes,
  marcarNotificacoesVistas,
  salvarPushSubscription,
  removerPushSubscription,
  type NotificacaoItem,
} from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

type PushStatus = "loading" | "unsupported" | "off" | "on";

export function NotificationBell({ className = "" }: { className?: string }) {
  const [itens, setItens] = useState<NotificacaoItem[]>([]);
  const [naoVistas, setNaoVistas] = useState(0);
  const [open, setOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>("loading");
  const [toast, setToast] = useState<string | null>(null);
  const prevNaoVistas = useRef<number | null>(null);

  const mostrarToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 6000);
  }, []);

  const carregar = useCallback(async () => {
    const r = await getNotificacoes();
    setItens(r.itens);
    setNaoVistas(r.naoVistas);
    if (prevNaoVistas.current !== null && r.naoVistas > prevNaoVistas.current) {
      const nova = r.itens.find((i) => i.nova);
      mostrarToast(nova ? `Novo lead: ${nova.nome}` : "Novo lead recebido");
    }
    prevNaoVistas.current = r.naoVistas;
  }, [mostrarToast]);

  useEffect(() => {
    carregar();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") carregar();
    }, 45000);
    return () => clearInterval(id);
  }, [carregar]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushStatus(sub ? "on" : "off"))
      .catch(() => setPushStatus("off"));
  }, []);

  async function ativarPush() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        mostrarToast("Permissão de notificação negada no navegador");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string),
      });
      await salvarPushSubscription(JSON.parse(JSON.stringify(sub)));
      setPushStatus("on");
      mostrarToast("Notificações no celular ativadas");
    } catch {
      mostrarToast("Não consegui ativar as notificações");
    }
  }

  async function desativarPush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removerPushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setPushStatus("off");
    } catch {
      /* ignora */
    }
  }

  async function marcarVistas() {
    await marcarNotificacoesVistas();
    setNaoVistas(0);
    prevNaoVistas.current = 0;
    setItens((prev) => prev.map((i) => ({ ...i, nova: false })));
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title="Notificações"
          className="relative flex size-8 shrink-0 items-center justify-center rounded-lg text-control-ink/45 transition hover:bg-control-bg hover:text-control-ink"
        >
          {naoVistas > 0 ? <BellRing className="size-4" strokeWidth={2} /> : <Bell className="size-4" strokeWidth={2} />}
          {naoVistas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-control-danger-600 px-1 text-[10px] font-bold leading-4 text-white">
              {naoVistas > 9 ? "9+" : naoVistas}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-control-line bg-control-surface shadow-lg">
              <div className="flex items-center justify-between border-b border-control-line px-3 py-2.5">
                <p className="text-sm font-semibold text-control-ink">Notificações</p>
                {naoVistas > 0 && (
                  <button
                    type="button"
                    onClick={marcarVistas}
                    className="flex items-center gap-1 text-xs font-medium text-control-blue-600 hover:underline"
                  >
                    <Check className="size-3.5" strokeWidth={2.5} />
                    Marcar como vistas
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {itens.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-control-ink/45">Nenhum lead recente.</p>
                ) : (
                  itens.map((it) => (
                    <div
                      key={it.id}
                      className={`flex items-start gap-2.5 border-b border-control-line/60 px-3 py-2.5 ${
                        it.nova ? "bg-control-blue-50/60" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          it.nova ? "bg-control-blue-600" : "bg-transparent"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-control-ink">{it.nome}</p>
                        {it.criativo && (
                          <p className="truncate text-[11px] text-control-ink/45">{it.criativo}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-control-ink/40">{tempoRelativo(it.data)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-control-line px-3 py-2.5">
                {pushStatus === "unsupported" ? (
                  <p className="text-[11px] text-control-ink/45">
                    Push não suportado neste navegador. No iPhone, adicione o app à tela inicial.
                  </p>
                ) : pushStatus === "on" ? (
                  <button
                    type="button"
                    onClick={desativarPush}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-control-bg px-3 py-2 text-xs font-medium text-control-ink/60 transition hover:bg-control-danger-100 hover:text-control-danger-600"
                  >
                    <Smartphone className="size-3.5" strokeWidth={2} />
                    Desativar push no celular
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={ativarPush}
                    disabled={pushStatus === "loading"}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-control-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-control-blue-700 disabled:opacity-50"
                  >
                    <Smartphone className="size-3.5" strokeWidth={2} />
                    Ativar notificações no celular
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-xl border border-control-line bg-control-surface px-4 py-3 shadow-lg">
          <BellRing className="size-4 text-control-blue-600" strokeWidth={2} />
          <span className="text-sm font-medium text-control-ink">{toast}</span>
        </div>
      )}
    </>
  );
}
