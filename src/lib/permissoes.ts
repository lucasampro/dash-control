import { prisma } from "./db";
import { getSession } from "./auth";

export type UsuarioAtual = {
  id: string;
  username: string;
  isAdmin: boolean;
  teamMemberId: string | null;
  teamMemberRole: "SDR" | "CLOSER" | null;
};

/** Carrega o usuário logado com o membro da equipe vinculado (se houver). */
export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { username: session.username },
    include: { teamMember: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
    teamMemberId: user.teamMemberId,
    teamMemberRole: user.teamMember?.role ?? null,
  };
}

/** Regra de edição de lead:
 * - Admin edita tudo.
 * - Quem não é um SDR (closer, ou login sem membro vinculado) edita tudo.
 * - Um SDR só edita leads sem SDR atribuído ou atribuídos a ele mesmo — não
 *   pode mexer no lead que pertence ao outro SDR. */
export function podeEditarLead(
  usuario: UsuarioAtual | null,
  leadSdrId: string | null,
): boolean {
  if (!usuario) return false;
  if (usuario.isAdmin) return true;
  if (usuario.teamMemberRole !== "SDR") return true;
  if (leadSdrId === null) return true;
  return leadSdrId === usuario.teamMemberId;
}
