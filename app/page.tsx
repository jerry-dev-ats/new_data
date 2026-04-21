/** @format */

"use client";

import { useState } from "react";
import { API_REGISTRY } from "@/lib/apis/registry";
import { ApiTabs } from "@/components/ApiTabs";
import { ApiPanel } from "@/components/ApiPanel";

function getInitialApiId(): string {
  return (
    API_REGISTRY.find((api) => api.id === "foodsafety-recall-sale-stop")?.id ??
    API_REGISTRY.find(
      (api) =>
        api.category.startsWith("식품") ||
        api.category.startsWith("식품안전나라"),
    )?.id ??
    API_REGISTRY[0]?.id ??
    ""
  );
}

export default function HomePage() {
  const [activeId, setActiveId] = useState<string>(getInitialApiId());
  const [tabsVisible, setTabsVisible] = useState(true);
  const active = API_REGISTRY.find((a) => a.id === activeId);

  if (!active) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-xl font-semibold">등록된 API가 없습니다.</h1>
        <p className="mt-2 text-sm text-slate-600">
          lib/apis/registry.ts에 ApiConfig를 추가해 주세요.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              공공 API 통합 뷰어
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            등록된 API {API_REGISTRY.length}개
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">현재 선택</p>
            <p className="truncate text-sm font-semibold text-slate-900">
              {active.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTabsVisible((visible) => !visible)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            {tabsVisible ? "탭 숨기기" : "탭 보기"}
          </button>
        </div>

        {tabsVisible && (
          <ApiTabs
            items={API_REGISTRY}
            activeId={activeId}
            onSelect={setActiveId}
          />
        )}
      </div>

      <ApiPanel key={active.id} config={active} />
    </main>
  );
}
