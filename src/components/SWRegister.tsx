"use client";

import { useEffect } from "react";

/** Registra il service worker per la PWA (cache shell + offline). */
export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* la PWA funziona comunque, solo senza cache offline */
      });
    }
  }, []);
  return null;
}
