"use client";

import { useApp } from "@/lib/store";
import { ErrorBox } from "./ui";
import type { ReactNode } from "react";

/** Gate comune: spinner finché lo store carica, errore con retry se il load fallisce. */
export default function Loading({ children }: { children: ReactNode }) {
  const { loading, loadError, reload } = useApp();
  if (loading) {
    return <div className="grid min-h-[40vh] place-items-center text-dim">Caricamento…</div>;
  }
  if (loadError) {
    return <ErrorBox msg={`Impossibile caricare i dati: ${loadError}`} onRetry={reload} />;
  }
  return <>{children}</>;
}
