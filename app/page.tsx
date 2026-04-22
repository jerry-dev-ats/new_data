/** @format */

"use client";

import { useEffect, useState } from "react";
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const active = API_REGISTRY.find((a) => a.id === activeId);

  useEffect(() => {
    if (!mobileDrawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [activeId]);

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
    <main className="relative flex min-h-screen flex-col">
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

      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen((open) => !open)}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {mobileDrawerOpen ? "목록 닫기" : "API 목록"}
            </button>
            <div className="min-w-0 flex gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  현재 API
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {active.title}
                </p>
                <p className="mb-2 truncate text-xs text-slate-500">
                  {active.category}
                </p>
              </div>
            </div>
          </div>
          <p className="hidden text-xs text-slate-400 sm:block">
            좌측 탐색 패널에서 카테고리별 API를 전환할 수 있습니다.
          </p>
        </div>
      </div>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="목록 닫기"
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(24rem,88vw)] flex-col border-r border-slate-200 bg-[#f8fafc] shadow-2xl">
            <div className="border-b border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                API 탐색
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">
                공공 API 목록
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                카테고리를 펼쳐 원하는 API로 바로 이동합니다.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <ApiTabs
                items={API_REGISTRY}
                activeId={activeId}
                onSelect={setActiveId}
              />
            </div>
            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="min-w-0">
          <ApiPanel key={active.id} config={active} />
        </div>
      </div>
    </main>
  );
}
