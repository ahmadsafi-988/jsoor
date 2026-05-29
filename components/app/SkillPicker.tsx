"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import type { SkillCategory, SkillWithCategories } from "@/lib/company/data";

type Props = {
  allSkills: SkillWithCategories[];
  categories?: SkillCategory[];
  initialSelectedIds?: number[];
  name?: string;
};

export function SkillPicker({
  allSkills,
  categories = [],
  initialSelectedIds = [],
  name = "skill_ids",
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialSelectedIds));
  const [query, setQuery] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allSkills.filter((skill) => {
      const matchesQuery = normalizedQuery
        ? skill.name.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesCategory =
        selectedCategoryIds.size === 0 ||
        (skill.skill_to_categories ?? []).some((entry) =>
          selectedCategoryIds.has(entry.category_id)
        );

      return matchesQuery && matchesCategory;
    });
  }, [allSkills, query, selectedCategoryIds]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f5e5e]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills..."
          className="w-full rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-2.5 pl-9 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
        />
      </div>

      {categories.length > 0 && (
        <div className="rounded-xl border border-[#e5e2e1] bg-white">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold text-[#1c1b1b]"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#5f5e5e]" />
              Filter by industry
              {selectedCategoryIds.size > 0 && (
                <span className="rounded-full bg-[#e5f7ee] px-2 py-0.5 text-xs font-semibold text-[#005232]">
                  {selectedCategoryIds.size} selected
                </span>
              )}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#5f5e5e] transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {filtersOpen && (
            <div className="border-t border-[#e5e2e1] bg-[#f6f3f2] p-3">
              {selectedCategoryIds.size > 0 && (
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryIds(new Set())}
                    className="text-xs font-semibold text-[#006d43] hover:text-[#005232]"
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const checked = selectedCategoryIds.has(category.id);
                  return (
                    <label
                      key={category.id}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        checked
                          ? "border-[#006d43] bg-[#e5f7ee] text-[#005232]"
                          : "border-[#e5e2e1] bg-white text-[#3d4a41] hover:border-[#006d43]/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(category.id)}
                        className="h-3.5 w-3.5 accent-[#006d43]"
                      />
                      {category.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {filteredSkills.map((skill) => {
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
        {filteredSkills.length === 0 && (
          <p className="w-full rounded-xl border border-dashed border-[#e5e2e1] px-4 py-6 text-center text-sm text-[#5f5e5e]">
            No matching skills found.
          </p>
        )}
      </div>
      <input type="hidden" name={name} value={JSON.stringify([...selected])} />
    </div>
  );
}
