import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sincronizarLeadsMeta } from "@/lib/meta-leads";

// Rota chamada por um cron externo (Vercel Cron) para sincronizar os leads
// de formulário nativo do Meta a cada minuto — serve de rede de segurança
// pro webhook (que já traz os leads em tempo real, mas pode falhar/atrasar).
// Autenticada por CRON_SECRET, não por sessão de usuário, pois é acionada
// fora do navegador.
export async function GET(req: NextRequest) {
  const secret =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const resultado = await sincronizarLeadsMeta();
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
