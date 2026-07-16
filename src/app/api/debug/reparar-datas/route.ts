import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// TEMPORÁRIO (reparo): restaura o campo `data` dos leads do Meta com o
// created_time real da Graph API (edições anteriores zeravam o horário/dia).
// Só admin. REMOVER depois de rodar.
export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Acesso restrito ao admin." }, { status: 401 });
  }

  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "META_PAGE_ACCESS_TOKEN ausente." }, { status: 500 });
  }

  const leads = await prisma.lead.findMany({
    where: { metaLeadId: { not: null } },
    select: { id: true, metaLeadId: true, data: true },
  });

  const corrigidos: { metaLeadId: string; de: string; para: string }[] = [];
  const erros: { metaLeadId: string; erro: string }[] = [];

  for (const lead of leads) {
    try {
      const url = `https://graph.facebook.com/v21.0/${lead.metaLeadId}?fields=created_time&access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as { created_time?: string; error?: unknown };
      if (!res.ok || !json.created_time) {
        erros.push({ metaLeadId: lead.metaLeadId!, erro: JSON.stringify(json.error ?? json) });
        continue;
      }
      const real = new Date(json.created_time);
      if (Math.abs(real.getTime() - lead.data.getTime()) > 60000) {
        await prisma.lead.update({ where: { id: lead.id }, data: { data: real } });
        corrigidos.push({
          metaLeadId: lead.metaLeadId!,
          de: lead.data.toISOString(),
          para: real.toISOString(),
        });
      }
    } catch (err) {
      erros.push({ metaLeadId: lead.metaLeadId!, erro: String(err) });
    }
  }

  return NextResponse.json({
    total: leads.length,
    corrigidos: corrigidos.length,
    detalhes: corrigidos,
    erros,
  });
}
