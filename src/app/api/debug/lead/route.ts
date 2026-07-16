import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// TEMPORÁRIO (debug): consulta o lead na Graph API do Meta pedindo campos extras
// pra descobrir se o "nome de usuário" do Instagram vem por API. Só admin.
// REMOVER depois da sondagem.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Acesso restrito ao admin." }, { status: 401 });
  }

  const leadId = req.nextUrl.searchParams.get("id");
  if (!leadId) {
    return NextResponse.json({ error: "Passe ?id=<leadgen_id>." }, { status: 400 });
  }

  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "META_PAGE_ACCESS_TOKEN ausente." }, { status: 500 });
  }

  const fields =
    "id,created_time,platform,is_organic,partner_name,ad_id,form_id,field_data,custom_disclaimer_responses";
  const url = `https://graph.facebook.com/v21.0/${leadId}?fields=${fields}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { cache: "no-store" });
  const raw = await res.json();
  return NextResponse.json({ status: res.status, raw });
}
