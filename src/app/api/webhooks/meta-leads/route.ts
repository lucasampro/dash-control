import { NextRequest, NextResponse } from "next/server";
import { processarWebhookMeta, verificaAssinaturaWebhook } from "@/lib/meta-leads";

// Endpoint que recebe leads de formulário nativo (Lead Ads) automaticamente
// via webhook do Meta. Só funciona de verdade depois que a Página do
// formulário for vinculada ao App com a permissão leads_retrieval e o
// produto Webhooks for configurado no Meta Business Manager, apontando pra
// esta URL (ver .env.example pras variáveis necessárias).

// Handshake de verificação exigido pelo Meta ao configurar o webhook.
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verificação inválida." }, { status: 403 });
}

// Recebe os eventos de leadgen (novo lead de formulário nativo).
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const assinatura = req.headers.get("x-hub-signature-256");

  if (!verificaAssinaturaWebhook(raw, assinatura)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 403 });
  }

  try {
    const payload = JSON.parse(raw);
    await processarWebhookMeta(payload);
  } catch (err) {
    // Sempre retorna 200 pro Meta não ficar reenviando o mesmo evento em
    // loop por causa de um erro nosso; o erro fica registrado no log.
    console.error("Erro ao processar webhook de Lead Ads do Meta:", err);
  }

  return NextResponse.json({ ok: true });
}
