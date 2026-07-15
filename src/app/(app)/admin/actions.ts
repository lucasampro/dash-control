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
