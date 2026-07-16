import { prisma } from "./db";

// Envia uma mensagem de texto pelo WhatsApp via uazapi. A config (URL base,
// token e destino) fica no banco (editável no Admin > Integrações). Sem config
// ou com a integração inativa, vira no-op — o painel continua funcionando, só
// não dispara o WhatsApp. Nunca joga erro pra cima: notificação é best-effort.
export async function enviarWhatsapp(texto: string): Promise<void> {
  const cfg = await prisma.integracaoWhatsapp.findUnique({ where: { id: "whatsapp" } });
  if (!cfg?.ativo) return;

  const baseUrl = cfg.baseUrl?.trim().replace(/\/+$/, "");
  const token = cfg.token?.trim();
  const destino = cfg.destino?.trim();
  if (!baseUrl || !token || !destino) return;

  try {
    const res = await fetch(`${baseUrl}/send/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({ number: destino, text: texto }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`WhatsApp (uazapi) respondeu ${res.status}: ${await res.text()}`);
    }
  } catch (erro) {
    console.error("Falha ao enviar notificação por WhatsApp:", erro);
  }
}
