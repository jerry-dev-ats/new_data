/** @format */

"use client";

import type { ApiConfig, JsonObject } from "@/lib/apis/types";
import type { InferredSchema } from "@/lib/render/inferSchema";
import { toLabel } from "@/lib/render/labelMap";
import { FieldValue } from "./FieldValue";

type Props = {
  item: JsonObject;
  schema: InferredSchema;
  config: ApiConfig;
  index: number;
};

export function ItemCard({ item, schema, config, index }: Props) {
  const titleKey = schema.titleKey;
  const subtitleKey = schema.subtitleKey;
  const imageKey = schema.imageKey;

  const primaryKeys = new Set(
    [titleKey, subtitleKey, imageKey].filter(Boolean) as string[],
  );

  const otherFields = schema.fields.filter((f) => !primaryKeys.has(f.key));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <header className="mb-3 flex items-start gap-3">
        {imageKey && typeof item[imageKey] === "string" && (
          <FieldValue value={item[imageKey]} hint="image" compact />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-medium">
              #{index + 1}
            </span>
            <span>{config.category}</span>
          </div>
          <h3 className="mt-1 break-words text-base font-semibold text-slate-900">
            {titleKey && item[titleKey] != null && item[titleKey] !== ""
              ? String(item[titleKey])
              : "(이름 없음)"}
          </h3>
          {subtitleKey && item[subtitleKey] != null && (
            <p className="text-sm text-slate-600">
              {String(item[subtitleKey])}
            </p>
          )}
        </div>
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2">
        {otherFields.map((f) => (
          <div
            key={f.key}
            className="flex flex-col border-t border-slate-100 pt-2 text-sm"
          >
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {toLabel(f.key, config.labelMap)}
            </dt>
            <dd className="mt-0.5 break-words text-slate-800">
              <FieldValue value={item[f.key] ?? null} hint={f.type} compact />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
