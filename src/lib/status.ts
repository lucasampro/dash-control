// Labels e variantes de badge para os enums do Prisma — usado em tabelas e
// telas de detalhe para uma leitura visual rápida do status.

import type { Variant } from "@/components/ui/Badge";

export const RESULTADO_LABEL: Record<string, string> = {
  EM_ANDAMENTO: "Em andamento",
  GANHO: "Ganho",
  PERDIDO: "Perdido",
};

export const RESULTADO_VARIANT: Record<string, Variant> = {
  EM_ANDAMENTO: "blue",
  GANHO: "success",
  PERDIDO: "danger",
};

export const REUNIAO_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  FEITA: "Feita",
  NO_SHOW: "No-show",
};

export const REUNIAO_VARIANT: Record<string, Variant> = {
  PENDENTE: "warning",
  FEITA: "success",
  NO_SHOW: "danger",
};

export const ORIGEM_LABEL: Record<string, string> = {
  PAGO: "Pago",
  ORGANICO: "Orgânico",
  LINK_BIO: "Link da bio",
  INDICACAO: "Indicação",
};

export const ORIGEM_VARIANT: Record<string, Variant> = {
  PAGO: "gold",
  ORGANICO: "blue",
  LINK_BIO: "success",
  INDICACAO: "warning",
};
