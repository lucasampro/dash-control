"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

export function SubmitButton({
  children,
  variant = "primary",
  className = "",
  savingLabel = "Salvando...",
  savedLabel = "Salvo",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  savingLabel?: string;
  savedLabel?: string;
}) {
  const { pending } = useFormStatus();
  const [justSaved, setJustSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 1800);
      wasPending.current = pending;
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending]);

  const base = variant === "secondary" ? secondaryButtonClass : primaryButtonClass;

  return (
    <button type="submit" disabled={pending} className={`${base} ${className}`}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {savingLabel}
        </>
      ) : justSaved ? (
        <>
          <Check className="size-4" />
          {savedLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
