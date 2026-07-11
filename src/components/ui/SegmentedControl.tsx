"use client";

import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

export function SegmentedControl({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div className="inline-flex w-full rounded-[10px] border border-control-line bg-control-bg/60 p-1">
      <input type="hidden" name={name} value={value} />
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue(opt.value)}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-control-surface text-control-ink shadow-sm"
                : "text-control-ink/45 hover:text-control-ink/70"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
