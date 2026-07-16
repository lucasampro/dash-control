"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function createUser(formData: FormData) {
  await requireAdmin();

  const username = String(formData.get("username") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const isAdmin = formData.get("isAdmin") === "on";

  if (!username || !name || password.length < 6) {
    throw new Error("Preencha usuário, nome e uma senha com pelo menos 6 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { username, name, passwordHash, isAdmin, ativo: true },
  });

  revalidatePath("/admin");
}

export async function toggleUserAtivo(id: string, ativo: boolean) {
  const session = await requireAdmin();

  const alvo = await prisma.user.findUnique({ where: { id } });
  if (alvo?.username === session.username && !ativo) {
    throw new Error("Você não pode desativar seu próprio usuário.");
  }

  await prisma.user.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!id || password.length < 6) {
    throw new Error("Senha deve ter pelo menos 6 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  revalidatePath("/admin");
}

// Salva a configuração da integração com o Meta (Conversions API). Se o campo
// do token vier em branco, mantém o token que já está salvo — assim o Lucas
// pode ajustar só o Pixel sem precisar re-digitar o token toda vez.
export async function upsertIntegracaoMeta(formData: FormData) {
  await requireAdmin();

  const datasetId = String(formData.get("datasetId") ?? "").trim() || null;
  const sourceName = String(formData.get("sourceName") ?? "").trim() || null;
  const tokenInput = String(formData.get("capiToken") ?? "").trim();

  const atual = await prisma.integracaoMeta.findUnique({ where: { id: "meta" } });
  const capiToken = tokenInput || atual?.capiToken || null;

  await prisma.integracaoMeta.upsert({
    where: { id: "meta" },
    create: { id: "meta", datasetId, capiToken, sourceName },
    update: { datasetId, capiToken, sourceName },
  });

  revalidatePath("/admin");
}

// Salva a configuração da integração com o WhatsApp (uazapi). Token em branco
// mantém o atual (não precisa re-digitar). "ativo" desliga o envio sem apagar
// as credenciais.
export async function upsertIntegracaoWhatsapp(formData: FormData) {
  await requireAdmin();

  const baseUrl = String(formData.get("baseUrl") ?? "").trim() || null;
  const destino = String(formData.get("destino") ?? "").trim() || null;
  const destinoNome = String(formData.get("destinoNome") ?? "").trim() || null;
  const ativo = formData.get("ativo") === "on";
  const tokenInput = String(formData.get("token") ?? "").trim();

  const atual = await prisma.integracaoWhatsapp.findUnique({ where: { id: "whatsapp" } });
  const token = tokenInput || atual?.token || null;

  await prisma.integracaoWhatsapp.upsert({
    where: { id: "whatsapp" },
    create: { id: "whatsapp", baseUrl, token, destino, destinoNome, ativo },
    update: { baseUrl, token, destino, destinoNome, ativo },
  });

  revalidatePath("/admin");
}
