"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/types";

const TABS = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: "/oggi", icon: "☀️", label: "Oggi" },
  { href: "/obiettivo", icon: "🎯", label: "Obiettivo" },
  { href: "/sezioni", icon: "🧩", label: "Sezioni" },
  { href: "/altro", icon: "📈", label: "Altro" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center gap-0.5 border-t border-line bg-[rgba(16,19,24,0.97)] px-2 pt-2 backdrop-blur-md"
      style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
    >
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="flex max-w-[110px] flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-bold"
            style={{ background: active ? `${C.blue}1E` : "transparent", color: active ? C.blue : C.dim }}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
