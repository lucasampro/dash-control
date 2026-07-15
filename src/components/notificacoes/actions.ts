"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { nomeDoLead } from "@/lib/lead-nome";

type SubscriptionJSON = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

/** Guarda (ou atualiza) a inscrição de Web Push do dispositivo atual. */
export async function salvarPushSubscription(sub: SubscriptionJSON) {
  const session = await getSession();
  if (!session) return { ok: false };
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, username: session.username },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      username: session.username,
    },
  });
  return { ok: true };
}

/** Remove a inscrição do dispositivo (quando o usuário desativa as notificações). */
export async function removerPushSubscription(endpoint: string) {
  if (!endpoint) return { ok: false };
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return { ok: true };
}

/** Marca todas as notificações como vistas pro usuário logado (zera o sino). */
export async function marcarNotificacoesVistas() {
  const session = await getSession();
  if (!session) return { ok: false };
  await prisma.user.update({
    where: { username: session.username },
    data: { notificacoesVistasEm: new Date() },
  });
  return { ok: true };
}

export type NotificacaoItem = {
  id: string;
  nome: string;
  criativo: string | null;
  data: string; // ISO
  nova: boolean;
};

/** Retorna os leads recentes (vindos do Meta) e quantos são novos desde a
 * última vez que o usuário abriu o sino. */
export async function getNotificacoes(): Promise<{
  naoVistas: number;
  itens: NotificacaoItem[];
}> {
  const session = await getSession();
  if (!session) return { naoVistas: 0, itens: [] };

  const user = await prisma.user.findUnique({
    where: { username: session.username },
    select: { notificacoesVistasEm: true },
  });
  const vistasEm = user?.notificacoesVistasEm ?? null;

  const leads = await prisma.lead.findMany({
    where: { metaLeadId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true, createdAt: true, dadosFormulario: true, criativo: { select: { nome: true } } },
  });

  const naoVistas = vistasEm
    ? await prisma.lead.count({
        where: { metaLeadId: { not: null }, createdAt: { gt: vistasEm } },
      })
    : 0;

  const itens: NotificacaoItem[] = leads.map((l) => ({
    id: l.id,
    nome: nomeDoLead(l.dadosFormulario),
    criativo: l.criativo?.nome ?? null,
    data: l.createdAt.toISOString(),
    nova: vistasEm ? l.createdAt > vistasEm : false,
  }));

  return { naoVistas, itens };
}
