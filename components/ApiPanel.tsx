/** @format */

"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ApiConfig,
  ApiQueryParam,
  JsonObject,
  NormalizedPage,
} from "@/lib/apis/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/apis/registry";
import { inferSchema } from "@/lib/render/inferSchema";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle";
import { ItemCard } from "./ItemCard";
import { ItemTable } from "./ItemTable";
import { JsonTree } from "./JsonTree";

type Props = { config: ApiConfig };

function formatKstDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}${get("month")}${get("day")}`;
}

function getKstHour(date: Date): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  }).format(date);

  return Number(hour);
}

function resolveLatestKmaPublishTime(): string {
  const now = new Date();
  const kstHour = getKstHour(now);

  if (kstHour >= 18) {
    return `${formatKstDate(now)}18`;
  }

  if (kstHour >= 6) {
    return `${formatKstDate(now)}06`;
  }

  const previousDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return `${formatKstDate(previousDay)}18`;
}

function resolveDefaultParamValue(param: ApiQueryParam): string {
  if (param.defaultValueStrategy === "latestKmaPublishTime") {
    return resolveLatestKmaPublishTime();
  }
  return param.defaultValue ?? "";
}

function getInitialParams(config: ApiConfig): Record<string, string> {
  return Object.fromEntries(
    (config.queryParams ?? []).map((param) => [
      param.key,
      resolveDefaultParamValue(param),
    ]),
  );
}

function normalizeParams(params: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0),
  );
}

function getParamValidationError(
  param: ApiQueryParam,
  rawValue: string,
): string | null {
  const value = rawValue.trim();

  if (!value) return null;
  if (!param.validationPattern) return null;

  const pattern = new RegExp(param.validationPattern);
  if (pattern.test(value)) return null;

  return param.validationMessage ?? `${param.label} 입력 형식을 확인해 주세요.`;
}

async function fetchPage(
  id: string,
  pageNo: number,
  params: Record<string, string>,
): Promise<NormalizedPage> {
  const search = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(DEFAULT_PAGE_SIZE),
  });

  for (const [key, value] of Object.entries(params)) {
    search.set(key, value);
  }

  const res = await fetch(`/api/proxy/${encodeURIComponent(id)}?${search}`, {
    headers: { Accept: "application/json" },
  });
  const body = await res.json();
  if (!res.ok || body?.error) {
    const msg = body?.message ?? `요청 실패 (${res.status})`;
    throw new Error(msg);
  }
  return body as NormalizedPage;
}

export function ApiPanel({ config }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [draftParams, setDraftParams] = useState<Record<string, string>>(
    getInitialParams(config),
  );
  const [activeParams, setActiveParams] = useState<Record<string, string>>(
    getInitialParams(config),
  );
  const hasQueryParams = (config.queryParams?.length ?? 0) > 0;
  const missingRequiredParams = (config.queryParams ?? []).filter(
    (param) => param.required && !(draftParams[param.key] ?? "").trim(),
  );
  const missingActiveRequiredParams = (config.queryParams ?? []).filter(
    (param) => param.required && !(activeParams[param.key] ?? "").trim(),
  );
  const draftValidationErrors = Object.fromEntries(
    (config.queryParams ?? [])
      .map((param) => [
        param.key,
        getParamValidationError(param, draftParams[param.key] ?? ""),
      ])
      .filter(([, error]) => Boolean(error)),
  ) as Record<string, string>;
  const activeValidationErrors = Object.fromEntries(
    (config.queryParams ?? [])
      .map((param) => [
        param.key,
        getParamValidationError(param, activeParams[param.key] ?? ""),
      ])
      .filter(([, error]) => Boolean(error)),
  ) as Record<string, string>;

  const query = useInfiniteQuery<NormalizedPage, Error>({
    queryKey: ["api", config.id, activeParams],
    initialPageParam: 1,
    enabled:
      missingActiveRequiredParams.length === 0 &&
      Object.keys(activeValidationErrors).length === 0,
    queryFn: ({ pageParam }) =>
      fetchPage(config.id, pageParam as number, activeParams),
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      missingRequiredParams.length > 0 ||
      Object.keys(draftValidationErrors).length > 0
    ) {
      return;
    }
    setActiveParams(normalizeParams(draftParams));
  };

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

      {hasQueryParams && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">조회 조건</p>
              <p className="mt-1 text-xs text-slate-500">
                필수 파라미터를 입력한 뒤 조회를 다시 실행합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(config.queryParams ?? []).map((param) => {
                const value = draftParams[param.key] ?? "";

                return (
                  <label key={param.key} className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-slate-700">
                      {param.label}
                      {param.required && (
                        <span className="ml-1 text-rose-500">*</span>
                      )}
                    </span>

                    {param.input === "select" ? (
                      <select
                        value={value}
                        onChange={(event) =>
                          setDraftParams((current) => ({
                            ...current,
                            [param.key]: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-slate-400"
                      >
                        {(param.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={value}
                        onChange={(event) =>
                          setDraftParams((current) => ({
                            ...current,
                            [param.key]: event.target.value,
                          }))
                        }
                        inputMode={param.inputMode}
                        placeholder={param.placeholder}
                        maxLength={param.maxLength}
                        className={
                          "rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 " +
                          (draftValidationErrors[param.key]
                            ? "border-rose-300 focus:border-rose-400"
                            : "border-slate-200")
                        }
                      />
                    )}

                    {draftValidationErrors[param.key] && (
                      <span className="text-[11px] text-rose-600">
                        {draftValidationErrors[param.key]}
                      </span>
                    )}
                    {param.helpText && (
                      <span className="text-[11px] text-slate-500">
                        {param.helpText}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={
                  missingRequiredParams.length > 0 ||
                  Object.keys(draftValidationErrors).length > 0
                }
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                조건으로 조회
              </button>
              {missingRequiredParams.length > 0 && (
                <p className="text-xs text-rose-600">
                  필수 입력:{" "}
                  {missingRequiredParams.map((param) => param.label).join(", ")}
                </p>
              )}
              {missingRequiredParams.length === 0 &&
                Object.keys(draftValidationErrors).length > 0 && (
                  <p className="text-xs text-rose-600">
                    입력 형식 확인:{" "}
                    {Object.entries(draftValidationErrors)
                      .map(([, message]) => message)
                      .join(" / ")}
                  </p>
                )}
            </div>
          </div>
        </form>
      )}

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

      {!query.isLoading &&
        !query.isError &&
        missingActiveRequiredParams.length === 0 &&
        Object.keys(activeValidationErrors).length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">입력 형식 확인 필요</p>
            <p className="mt-1">
              {Object.values(activeValidationErrors).join(" ")}
            </p>
          </div>
        )}

      {!query.isLoading &&
        !query.isError &&
        missingActiveRequiredParams.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">조회 조건 입력 필요</p>
            <p className="mt-1">
              {missingActiveRequiredParams
                .map((param) => param.label)
                .join(", ")}
              값을 입력한 뒤 조회해 주세요.
            </p>
          </div>
        )}

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
