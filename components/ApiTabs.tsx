/** @format */

"use client";

import { useEffect, useState } from "react";
import type { ApiConfig } from "@/lib/apis/types";

type GroupKey = "food" | "drug" | "cosmetic";

type Props = {
  items: ApiConfig[];
  activeId: string;
  onSelect: (id: string) => void;
};

const GROUP_META: Record<GroupKey, { label: string; description: string }> = {
  food: {
    label: "식품123",
    description: "식품안전나라 · HACCP · 식품 회수/검사",
  },
  drug: {
    label: "의약품",
    description: "의약품 · DUR · 의료기기",
  },
  cosmetic: {
    label: "생활·화장품",
    description: "화장품 · 공산품 · 자동차 · 해외리콜",
  },
};

function getGroupKey(api: ApiConfig): GroupKey {
  if (
    api.category.startsWith("식품") ||
    api.category.startsWith("식품안전나라")
  ) {
    return "food";
  }
  if (api.category.startsWith("의약품")) {
    return "drug";
  }
  if (api.category.startsWith("화장품")) {
    return "cosmetic";
  }
  if (
    api.id.includes("consumer-recall-drug") ||
    api.id.includes("consumer-recall-medical-device")
  ) {
    return "drug";
  }
  if (
    api.id.includes("consumer-recall-cosmetic") ||
    api.id.includes("consumer-recall-industrial") ||
    api.id.includes("consumer-recall-automobile") ||
    api.id.includes("consumer-recall-overseas")
  ) {
    return "cosmetic";
  }
  return "food";
}

export function ApiTabs({ items, activeId, onSelect }: Props) {
  const [openGroup, setOpenGroup] = useState<GroupKey | null>(() => {
    const active = items.find((api) => api.id === activeId);
    return active ? getGroupKey(active) : "food";
  });

  useEffect(() => {
    const active = items.find((api) => api.id === activeId);
    if (active) {
      setOpenGroup(getGroupKey(active));
    }
  }, [activeId, items]);

  const grouped = items.reduce<Record<GroupKey, ApiConfig[]>>(
    (acc, api) => {
      acc[getGroupKey(api)].push(api);
      return acc;
    },
    { food: [], drug: [], cosmetic: [] },
  );
  const activeItem = items.find((api) => api.id === activeId);

  return (
    <nav aria-label="공공 API 목록" className="flex flex-col gap-3">
      {activeItem && (
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            선택 중
          </p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
            {activeItem.title}
          </p>
          <p className="mt-1 text-xs text-slate-500">{activeItem.category}</p>
        </section>
      )}

      {(Object.keys(GROUP_META) as GroupKey[]).map((groupKey) => {
        const groupItems = grouped[groupKey];
        const meta = GROUP_META[groupKey];
        const isOpen = openGroup === groupKey;
        const hasActive = groupItems.some((api) => api.id === activeId);

        return (
          <section
            key={groupKey}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                setOpenGroup((current) =>
                  current === groupKey ? null : groupKey,
                )
              }
              aria-expanded={isOpen}
              className={
                "flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left transition " +
                (hasActive ? "bg-slate-950 text-white" : "hover:bg-slate-50")
              }
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                      (hasActive
                        ? "bg-white/15 text-slate-200"
                        : "bg-slate-100 text-slate-600")
                    }
                  >
                    {groupItems.length}개
                  </span>
                </div>
                <p
                  className={
                    "mt-1 text-xs leading-5 " +
                    (hasActive ? "text-slate-300" : "text-slate-500")
                  }
                >
                  {meta.description}
                </p>
              </div>
              <span
                className={
                  "mt-1 text-xs transition-transform " +
                  (isOpen ? "rotate-180" : "")
                }
                aria-hidden
              >
                ▼
              </span>
            </button>

            {isOpen && (
              <div className="space-y-2 border-t border-slate-200 bg-slate-50/80 px-2 py-2">
                {groupItems.map((api) => {
                  const active = api.id === activeId;

                  return (
                    <button
                      key={api.id}
                      type="button"
                      onClick={() => onSelect(api.id)}
                      className={
                        "flex w-full flex-col items-start rounded-xl border px-3 py-3 text-left transition " +
                        (active
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100")
                      }
                    >
                      <span
                        className={
                          "text-[11px] font-medium " +
                          (active ? "text-slate-300" : "text-slate-500")
                        }
                      >
                        {api.category}
                      </span>
                      <span className="mt-1 text-sm font-semibold leading-5">
                        {api.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </nav>
  );
}
