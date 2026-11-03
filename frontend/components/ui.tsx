"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { useApp } from "@/lib/app-context";
import type { Verdict } from "@/lib/types";

export function Card({ children, className = "", inset = false }: { children: ReactNode; className?: string; inset?: boolean }) {
  return <section className={`${inset ? "neu-in" : "neu"} p-5 ${className}`}>{children}</section>;
}

export function Button({ primary, active, className = "", ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; active?: boolean }) {
  return <button {...rest} className={`neu-btn ${primary ? "neu-btn-primary" : ""} ${active ? "is-active" : ""} ${className}`} />;
}

export function Chip({ pressed, children, onClick }: { pressed: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>{children}</button>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />
    </label>
  );
}

export function Stars({ value, onChange, readOnly = false }: { value: number | null; onChange?: (n: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1" role={readOnly ? "img" : "radiogroup"} aria-label={`${value ?? 0} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={readOnly} aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange?.(n)} className="text-2xl leading-none disabled:cursor-default"
          style={{ color: (value ?? 0) >= n ? "#e0a526" : "var(--muted)", opacity: (value ?? 0) >= n ? 1 : 0.45 }}>
          ★
        </button>
      ))}
    </div>
  );
}

const ICON: Record<Verdict, string> = { go: "✅", caution: "⚠️", avoid: "⛔" };
export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { t } = useApp();
  return <span className={`badge badge-${verdict}`}><span aria-hidden>{ICON[verdict]}</span>{t(verdict)}</span>;
}

export function ErrorBanner({ message, onClose }: { message: string | null; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="neu-in-sm p-3 mb-4 flex items-start justify-between gap-3" style={{ color: "var(--avoid)" }}>
      <span className="font-medium">{message}</span>
      {onClose && <button className="font-bold" aria-label="Dismiss" onClick={onClose}>✕</button>}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return <p className="neu-in-sm p-4 text-muted" role="status" aria-live="polite">⏳ {label}</p>;
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.round((100 * value) / total) : 0;
  return (
    <div className="neu-in-sm h-3 w-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
    </div>
  );
}
