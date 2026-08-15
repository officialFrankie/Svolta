"use client";

import type { Benefit } from "@/lib/benefits";
import { C } from "@/lib/types";
import { Card } from "./ui";

export default function BenefitCard({ b }: { b: Benefit }) {
  return (
    <Card accent={b.hero ? C.green : undefined}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xl">{b.icon}</span>
        <b className="text-[15px]">{b.title}</b>
      </div>
      <div className="text-[13.5px] leading-relaxed">
        <span className="font-extrabold text-accgreen">ORA → </span>
        {b.now}
      </div>
      <div className="mt-1.5 text-[13.5px] leading-relaxed">
        <span className="font-extrabold text-accblue">SE CONTINUI → </span>
        {b.next}
      </div>
    </Card>
  );
}
