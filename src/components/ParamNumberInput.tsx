import { useState, type KeyboardEvent } from "react";

function isIntermediateNumeric(raw: string): boolean {
  const s = raw.trim();
  if (s === "" || s === "-" || s === "." || s === "-.") return true;
  if (s.endsWith(".") || s.endsWith("-")) return true;
  return false;
}

type ParamNumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  title?: string;
};

/** Number input that keeps a local draft while typing so 0, decimals, and multi-digit edits work. */
export function ParamNumberInput({
  value,
  onChange,
  min,
  max,
  step,
  title,
}: ParamNumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (isIntermediateNumeric(trimmed)) {
      setDraft(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      setDraft(null);
      return;
    }
    onChange(n);
    setDraft(null);
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      title={title}
      value={draft ?? value}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (!isIntermediateNumeric(raw)) {
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(n);
        }
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
