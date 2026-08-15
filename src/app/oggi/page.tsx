"use client";

import DayLog from "@/components/DayLog";
import Loading from "@/components/Loading";
import { todayKey } from "@/lib/types";

export default function OggiPage() {
  return (
    <Loading>
      <DayLog date={todayKey()} />
    </Loading>
  );
}
