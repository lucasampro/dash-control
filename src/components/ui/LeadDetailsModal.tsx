"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ghostButtonClass, subtleCardClass, sectionTitleClass } from "@/lib/ui";

type LeadDetailsModalProps = {
  campanha: string | null;
  conjunto: string | null;
  criativoNome: string | null;
  dadosFormulario: Record<string, string> | null;
};

export function LeadDetailsModal({
  campanha,
  conjunto,
  criativoNome,
  dadosFormulario,
}: LeadDetailsModalProps) {
  const [open, setOpen] = useState(false);

  const temUtm = Boolean(campanha || conjunto || criativoNome);
  const temFormulario = Boolean(dadosFormulario && Object.keys(dadosFormulario).length > 0);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${ghostButtonClass} whitespace-nowrap`}>
        Ver detalhes
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-control-ink/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-control-line bg-control-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-control-ink">Detalhes do lead</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-control-ink/40 transition hover:bg-control-bg hover:text-control-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className={`${sectionTitleClass} mb-2`}>UTM / Origem</p>
                {temUtm ? (
                  <div className={`${subtleCardClass} flex flex-col gap-2`}>
                    {campanha && (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-control-ink/40">
                          Campanha
                        </p>
                        <p className="text-sm text-control-ink">{campanha}</p>
                      </div>
                    )}
                    {conjunto && (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-control-ink/40">
                          Conjunto
                        </p>
                        <p className="text-sm text-control-ink">{conjunto}</p>
                      </div>
                    )}
                    {criativoNome && (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-control-ink/40">
                          Anúncio
                        </p>
                        <p className="text-sm text-control-ink">{criativoNome}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-control-ink/45">Sem dados de UTM.</p>
                )}
              </div>

              <div>
                <p className={`${sectionTitleClass} mb-2`}>Dados do formulário</p>
                {temFormulario ? (
                  <div className={`${subtleCardClass} grid grid-cols-1 gap-3 sm:grid-cols-2`}>
                    {Object.entries(dadosFormulario!).map(([campo, valor]) => (
                      <div key={campo}>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-control-ink/40">
                          {campo}
                        </p>
                        <p className="text-sm text-control-ink">{valor}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-control-ink/45">
                    Sem dados de formulário (lead cadastrado manualmente ou ainda não sincronizado).
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
