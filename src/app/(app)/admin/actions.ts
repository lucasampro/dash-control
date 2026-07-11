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
