import webpush from "web-push";
import { prisma } from "./db";

// Configura as credenciais VAPID uma única vez. Sem as chaves, o envio de push
// vira no-op (o painel continua funcionando, só não dispara push no celular).
const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "https://dash-control.vercel.app";

let vapidConfigurado = false;
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  vapidConfigurado = true;
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Envia uma notificação Web Push pra todos os dispositivos inscritos. Remove
 * automaticamente as inscrições que o navegador já invalidou (404/410).
 */
export async function enviarPushParaTodos(payload: PushPayload) {
  if (!vapidConfigurado) return;

  const inscricoes = await prisma.pushSubscription.findMany();
  if (inscricoes.length === 0) return;

  const corpo = JSON.stringify(payload);

  await Promise.all(
    inscricoes.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          corpo,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Inscrição expirada/cancelada no navegador — limpa do banco.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Erro ao enviar Web Push:", err);
        }
      }
    }),
  );
}
