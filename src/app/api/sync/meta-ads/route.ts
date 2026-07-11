import { NextRequest, NextResponse } from "next/server";
import { syncMetaAdsInvestimento } from "@/lib/meta-ads";
import { mesAtual } from "@/lib/mesReferencia";

// Rota chamada por um cron externo (Vercel Cron, etc.) para sincronizar o
// investimento diário automaticamente. Autenticada por CRON_SECRET, não por
// sessão de usuário, pois é acionada fora do navegador.
export async function GET(req: NextRequest) {
  const secret =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const dias = await syncMetaAdsInvestimento(mesAtual());
    return NextResponse.json({ ok: true, dias });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
