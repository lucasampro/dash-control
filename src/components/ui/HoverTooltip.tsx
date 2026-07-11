"use client";

import { useRef, useState, type ReactNode } from "react";

interface HoverTooltipProps {
  /** Texto do tooltip. Quando omitido, o wrapper não adiciona nenhum listener. */
  tooltip?: string;
  className?: string;
  children: ReactNode;
}

/** Envolve `children` e mostra um tooltip que acompanha o cursor enquanto o mouse
 * estiver sobre a área. Client component isolado para não obrigar os componentes
 * que o usam (ex: KpiCard) a virarem client components inteiros. */
export function HoverTooltip({ tooltip, className, children }: HoverTooltipProps) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const x = e.clientX;
    const y = e.clientY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setCursor({ x, y }));
  }

  return (
    <div
      className={className}
      onMouseMove={tooltip ? handleMouseMove : undefined}
      onMouseLeave={tooltip ? () => setCursor(null) : undefined}
    >
      {children}
      {tooltip && cursor && (
        <div
          className="pointer-events-none fixed z-50 max-w-[220px] rounded-lg border border-control-line bg-control-surface/95 px-2.5 py-1.5 text-center text-[12px] font-medium normal-case leading-snug tracking-normal text-control-ink shadow-[0_10px_28px_-8px_rgba(15,23,41,0.25)] backdrop-blur-sm transition-opacity duration-100"
          style={{ left: cursor.x, top: cursor.y, transform: "translate(-50%, calc(-100% - 12px))" }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
