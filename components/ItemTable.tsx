'use client';

import type { ApiConfig, JsonObject } from '@/lib/apis/types';
import type { InferredSchema } from '@/lib/render/inferSchema';
import { toLabel } from '@/lib/render/labelMap';
import { FieldValue } from './FieldValue';

type Props = {
  items: JsonObject[];
  schema: InferredSchema;
  config: ApiConfig;
};

export function ItemTable({ items, schema, config }: Props) {
  // 제시 순서: title → subtitle → 나머지 presence 높은 순
  const orderedFields = [...schema.fields].sort((a, b) => {
    const priority = (k: string) =>
      k === schema.titleKey ? 0 : k === schema.subtitleKey ? 1 : 2;
    const p = priority(a.key) - priority(b.key);
    if (p !== 0) return p;
    return b.presence - a.presence;
  });

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              #
            </th>
            {orderedFields.map((f) => (
              <th
                key={f.key}
                className="whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                title={f.key}
              >
                {toLabel(f.key, config.labelMap)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="sticky left-0 z-10 bg-white px-3 py-2 text-slate-500 tabular-nums group-hover:bg-slate-50">
                {i + 1}
              </td>
              {orderedFields.map((f) => (
                <td
                  key={f.key}
                  className="max-w-sm px-3 py-2 align-top text-slate-800"
                >
                  <FieldValue value={item[f.key] ?? null} hint={f.type} compact />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
