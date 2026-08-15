"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import DayLog from "@/components/DayLog";
import Loading from "@/components/Loading";
import { SectionTitle } from "@/components/ui";

/** Vedi/modifica un giorno passato (dalla lista Storico). */
export default function GiornoPage() {
  const params = useParams<{ date: string }>();
  const date = params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  return (
    <Loading>
      <div className="flex items-center justify-between">
        <SectionTitle>
          {new Date(`${date}T12:00`).toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </SectionTitle>
        <Link href="/altro?vista=storico" className="text-[13px] font-bold text-accblue">
          ← Storico
        </Link>
      </div>
      <DayLog date={date} />
    </Loading>
  );
}
