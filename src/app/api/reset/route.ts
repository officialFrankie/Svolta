import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reset completo: diario, obiettivi e impostazioni tornano ai default. */
export async function POST() {
  try {
    await prisma.$transaction([
      prisma.entry.deleteMany(),
      prisma.goal.deleteMany(),
      prisma.settings.deleteMany(),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Errore reset" },
      { status: 500 }
    );
  }
}
