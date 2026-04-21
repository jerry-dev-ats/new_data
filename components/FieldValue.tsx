'use client';

import type { JsonValue } from '@/lib/apis/types';
import { classifyValue, type FieldType } from '@/lib/render/inferSchema';
import { formatDate, formatNumber } from '@/lib/render/formatValue';
import { useState } from 'react';

type Props = {
  value: JsonValue;
  hint?: FieldType;
  compact?: boolean;
};

export function FieldValue({ value, hint, compact }: Props) {
  const type = hint ?? classifyValue(value);

  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">-</span>;
  }

  if (type === 'image' && typeof value === 'string') {
    return (
      <a href={value} target="_blank" rel="noreferrer noopener">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt=""
          loading="lazy"
          className="h-16 w-16 rounded border border-slate-200 object-cover"
        />
      </a>
    );
  }

  if (type === 'url' && typeof value === 'string') {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer noopener"
        className="break-all text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
      >
        {value}
      </a>
    );
  }

  if (type === 'date' && typeof value === 'string') {
    return <span>{formatDate(value)}</span>;
  }

  if (
    (type === 'number' && typeof value === 'number') ||
    (type === 'numericString' && typeof value === 'string')
  ) {
    return <span className="tabular-nums">{formatNumber(value as number | string)}</span>;
  }

  if (type === 'boolean') {
    return (
      <span
        className={
          'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ' +
          (value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')
        }
      >
        {value ? '예' : '아니오'}
      </span>
    );
  }

  if (type === 'array' && Array.isArray(value)) {
    return <NestedCollapsible count={value.length} value={value} compact={compact} />;
  }

  if (type === 'object' && typeof value === 'object') {
    const keys = Object.keys(value as object);
    return (
      <NestedCollapsible
        count={keys.length}
        label={`객체 · ${keys.length}개 필드`}
        value={value}
        compact={compact}
      />
    );
  }

  if (type === 'longText' && typeof value === 'string') {
    return <LongText text={value} />;
  }

  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

function LongText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (text.length <= 120 || open) {
    return (
      <span>
        <span className="whitespace-pre-wrap break-words">{text}</span>
        {text.length > 120 && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-2 text-xs text-blue-600 hover:underline"
          >
            접기
          </button>
        )}
      </span>
    );
  }
  return (
    <span>
      <span className="whitespace-pre-wrap break-words">
        {text.slice(0, 120)}…
      </span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-2 text-xs text-blue-600 hover:underline"
      >
        더 보기
      </button>
    </span>
  );
}

function NestedCollapsible({
  count,
  label,
  value,
  compact,
}: {
  count: number;
  label?: string;
  value: JsonValue;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex w-fit items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
      >
        <span>{open ? '▼' : '▶'}</span>
        <span>{label ?? `배열 · ${count}개 항목`}</span>
      </button>
      {open && (
        <pre
          className={
            'mt-1 max-h-72 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 text-[11px] leading-relaxed ' +
            (compact ? 'max-w-md' : 'max-w-3xl')
          }
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}
