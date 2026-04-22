"use client";

import { useState } from "react";
import type { Tables } from "@/lib/supabase_generated_types";

type Props = {
  allSkills: Tables<"skills">[];
  initialSelectedIds?: number[];
  name?: string;
};

export function SkillPicker({ allSkills, initialSelectedIds = [], name = "skill_ids" }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialSelectedIds));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {allSkills.map((skill) => {
          const isSelected = selected.has(skill.id);
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => toggle(skill.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isSelected
                  ? "bg-[#006d43] text-white border-[#006d43]"
                  : "bg-[#f6f3f2] text-[#3d4a41] border-[#e5e2e1] hover:border-[#006d43]/40"
              }`}
            >
              {skill.name}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={JSON.stringify([...selected])} />
    </div>
  );
}
