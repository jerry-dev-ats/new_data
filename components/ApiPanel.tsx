/** @format */

"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiConfig, JsonObject, NormalizedPage } from "@/lib/apis/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/apis/registry";
import { inferSchema } from "@/lib/render/inferSchema";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle";
import { ItemCard } from "./ItemCard";
import { ItemTable } from "./ItemTable";
import { JsonTree } from "./JsonTree";

type Props = { config: ApiConfig };

async function fetchPage(id: string, pageNo: number): Promise<NormalizedPage> {
  const res = await fetch(
    `/api/proxy/${encodeURIComponent(id)}?pageNo=${pageNo}&numOfRows=${DEFAULT_PAGE_SIZE}`,
    { headers: { Accept: "application/json" } },
  );
  const body = await res.json();
  if (!res.ok || body?.error) {
    const msg = body?.message ?? `요청 실패 (${res.status})`;
    throw new Error(msg);
  }
  return body as NormalizedPage;
}

export function ApiPanel({ config }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const query = useInfiniteQuery<NormalizedPage, Error>({
    queryKey: ["api", config.id],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(config.id, pageParam as number),
    getNextPageParam: (last) => {
      const loaded = last.pageNo * last.numOfRows;
      return loaded < last.totalCount ? last.pageNo + 1 : undefined;
    },
  });

  const allItems: JsonObject[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const schema = useMemo(() => inferSchema(allItems), [allItems]);

  const totalCount = query.data?.pages.at(-1)?.totalCount ?? 0;

  // 무한스크롤 sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            query.hasNextPage &&
            !query.isFetchingNextPage
          ) {
            query.fetchNextPage();
          }
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [query]);

  return (
    <section className="flex w-full flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {config.category}
          </p>
          <h2 className="text-xl font-semibold text-slate-900">
            {config.title}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            총 {totalCount.toLocaleString("ko-KR")}건
            {allItems.length > 0 && ` · 불러옴 ${allItems.length}건`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => query.refetch()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            새로고침
          </button>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>
      </header>

      {query.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">API 호출 실패</p>
          <p className="mt-1 whitespace-pre-wrap">{query.error?.message}</p>
          {config.note && (
            <p className="mt-2 text-xs text-red-500">힌트: {config.note}</p>
          )}
        </div>
      )}

      {query.isLoading && <LoadingSkeleton />}

      {!query.isLoading && !query.isError && allItems.length === 0 && (
        <EmptyState note={config.note} />
      )}

      {allItems.length > 0 && viewMode === "card" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allItems.map((item, i) => (
            <ItemCard
              key={i}
              item={item}
              schema={schema}
              config={config}
              index={i}
            />
          ))}
        </div>
      )}

      {allItems.length > 0 && viewMode === "table" && (
        <ItemTable items={allItems} schema={schema} config={config} />
      )}

      {allItems.length > 0 && viewMode === "json" && (
        <JsonTree value={allItems} />
      )}

      <div ref={sentinelRef} aria-hidden className="h-6 w-full" />

      {query.isFetchingNextPage && (
        <p className="py-4 text-center text-sm text-slate-500">
          다음 페이지 불러오는 중…
        </p>
      )}
      {!query.hasNextPage && allItems.length > 0 && (
        <p className="py-4 text-center text-xs text-slate-400">
          마지막 페이지까지 모두 불러왔습니다.
        </p>
      )}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

function EmptyState({ note }: { note?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-700">
        표시할 데이터가 없습니다.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        서비스키가 정확한지, API 엔드포인트가 실제로 승인된 URL과 일치하는지
        확인해 주세요.
      </p>
      {note && <p className="mt-2 text-[11px] text-slate-400">{note}</p>}
    </div>
  );
}
