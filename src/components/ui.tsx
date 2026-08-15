"use client";

import { C } from "@/lib/types";
import type { CSSProperties, ReactNode, TextareaHTMLAttributes } from "react";

/* ---------- atomi UI (dal prototipo svolta-v3) ---------- */

export function Card({
  children,
  className = "",
  style,
  onClick,
  accent,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  accent?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-card border border-line p-4 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ ...(accent ? { boxShadow: `inset 0 0 0 1.5px ${accent}` } : {}), ...style }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mx-0.5 my-1 text-[13px] font-bold uppercase tracking-[0.1em] text-dim">
      {children}
    </div>
  );
}

export function Ring({
  pct,
  size = 108,
  stroke = 10,
  color,
  label,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  label: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset .8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="font-extrabold text-ink" style={{ fontSize: size * 0.26 }}>
            {Math.round(pct)}
            <span className="text-dim" style={{ fontSize: size * 0.13 }}>
              %
            </span>
          </div>
        </div>
      </div>
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-dim">{label}</div>
    </div>
  );
}

export function BigToggle({
  on,
  onLabel,
  offLabel,
  onColor,
  offColor,
  onChange,
  icon,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  onColor: string;
  offColor: string;
  onChange: (v: boolean) => void;
  icon: string;
}) {
  const col = on ? onColor : offColor;
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-4 text-[15px] font-extrabold"
      style={{ background: on ? `${onColor}22` : `${offColor}18`, boxShadow: `inset 0 0 0 1.5px ${col}`, color: col }}
    >
      <span className="text-[22px]">{icon}</span>
      {on ? onLabel : offLabel}
    </button>
  );
}

export function Chip({
  on,
  onChange,
  icon,
  label,
  color = C.cyan,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  icon: string;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-bold"
      style={{
        background: on ? `${color}22` : C.cardSoft,
        boxShadow: `inset 0 0 0 1.5px ${on ? color : C.line}`,
        color: on ? color : C.dim,
      }}
    >
      <span>{icon}</span>
      {label}
      {on ? " ✓" : ""}
    </button>
  );
}

export function MiniInput({
  label,
  value,
  onChange,
  suffix,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <div className="min-w-[92px] flex-[1_1_30%]">
      <div className="mb-1 text-[11px] font-bold text-dim">{label}</div>
      <div className="flex items-center rounded-xl border border-line bg-cardsoft px-2.5">
        {prefix && <span className="text-[13px] font-bold text-dim">{prefix}</span>}
        <input
          value={value}
          inputMode="decimal"
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-1 py-2.5 text-[17px] font-bold text-ink outline-none"
        />
        {suffix && <span className="text-xs font-bold text-dim">{suffix}</span>}
      </div>
    </div>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  color = C.ink,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  const btn =
    "h-10 w-10 rounded-xl border border-line bg-cardsoft text-xl font-bold text-ink";
  return (
    <div className="flex-1 text-center">
      <div className="mb-1.5 text-[11px] font-bold text-dim">{label}</div>
      <div className="flex items-center justify-center gap-3">
        <button className={btn} onClick={() => onChange(Math.max(0, Number(value) - 1))}>
          −
        </button>
        <span className="min-w-[30px] text-[26px] font-extrabold" style={{ color }}>
          {value}
        </span>
        <button className={btn} onClick={() => onChange(Number(value) + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function ScoreBar({
  name,
  val,
  max,
  color,
}: {
  name: string;
  val: number;
  max: number;
  color: string;
}) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex justify-between text-[13px]">
        <span className="font-semibold text-ink">{name}</span>
        <span className="font-bold text-dim">
          {val}/{max}
        </span>
      </div>
      <div className="h-[7px] rounded bg-line">
        <div
          className="h-full rounded transition-[width] duration-500"
          style={{ width: `${Math.min(100, (val / max) * 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-y rounded-xl border border-line bg-cardsoft p-3 font-sans text-[15px] text-ink outline-none placeholder:text-[#5A6675] ${props.className ?? ""}`}
    />
  );
}

export function Btn({
  children,
  onClick,
  disabled,
  color = C.blue,
  outline,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  outline?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[14px] py-[15px] text-[15px] font-extrabold disabled:cursor-default"
      style={{
        border: outline ? `1.5px solid ${color}` : "none",
        background: disabled ? C.line : outline ? "transparent" : color,
        color: outline ? color : "#0C1220",
      }}
    >
      {children}
    </button>
  );
}

export function Scale({
  label,
  value,
  onChange,
  color,
  darkText = "#10131A",
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  color: string;
  darkText?: string;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 text-[11px] font-bold uppercase text-dim">{label}</div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="h-9 flex-1 rounded-[10px] font-extrabold"
            style={{
              background: n <= value ? color : C.cardSoft,
              boxShadow: `inset 0 0 0 1.5px ${n <= value ? color : C.line}`,
              color: n <= value ? darkText : C.dim,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ErrorBox({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  if (!msg) return null;
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-accred/40 bg-accred/10 px-3 py-2.5 text-[13px] font-bold text-accred">
      <span>{msg}</span>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 rounded-lg border border-accred px-2.5 py-1">
          Riprova
        </button>
      )}
    </div>
  );
}
