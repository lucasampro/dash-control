"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createTeamMember(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!nome || (role !== "SDR" && role !== "CLOSER")) {
    throw new Error("Nome e função são obrigatórios.");
  }

  await prisma.teamMember.create({ data: { nome, role } });
  revalidatePath("/equipe");
}

export async function toggleTeamMemberAtivo(id: string, ativo: boolean) {
  await prisma.teamMember.update({ where: { id }, data: { ativo } });
  revalidatePath("/equipe");
}
