"use client";

import { useApp } from "@/lib/store";

export default function Header() {
  const { saveFlash } = useApp();
  return (
    <div className="flex items-center justify-between">
      <div className="text-lg font-extrabold tracking-[0.14em]">SVOLTA</div>
      <div className="text-xs text-dim">
        {saveFlash ||
          new Date().toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
      </div>
    </div>
  );
}
