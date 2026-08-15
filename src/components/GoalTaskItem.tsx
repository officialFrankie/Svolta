"use client";

import { C } from "@/lib/types";

export default function GoalTaskItem({
  task,
  done,
  color,
  onToggle,
}: {
  task: string;
  done: boolean;
  color: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 bg-transparent px-0.5 py-2 text-left text-sm font-semibold"
      style={{ color: done ? C.dim : C.ink, textDecoration: done ? "line-through" : "none" }}
    >
      <span
        className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] text-[13px] font-extrabold"
        style={{
          background: done ? color : C.cardSoft,
          boxShadow: `inset 0 0 0 1.5px ${done ? color : C.line}`,
          color: "#10131A",
        }}
      >
        {done ? "✓" : ""}
      </span>
      {task}
    </button>
  );
}
