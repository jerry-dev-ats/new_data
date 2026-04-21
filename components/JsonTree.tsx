'use client';

import { useState } from 'react';
import type { JsonValue } from '@/lib/apis/types';

type Props = {
  value: JsonValue;
  initialOpen?: boolean;
};

export function JsonTree({ value, initialOpen = true }: Props) {
  return (
    <pre className="overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-[12px] leading-relaxed text-slate-100">
      <Node value={value} open={initialOpen} path="$" />
    </pre>
  );
}

function Node({
  value,
  open: defaultOpen,
  path,
}: {
  value: JsonValue;
  open: boolean;
  path: string;
}) {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (typeof value === 'string')
    return <span className="text-emerald-300">&quot;{value}&quot;</span>;
  if (typeof value === 'number')
    return <span className="text-sky-300">{value}</span>;
  if (typeof value === 'boolean')
    return <span className="text-amber-300">{String(value)}</span>;

  if (Array.isArray(value)) {
    return (
      <Collapsible
        label={`[ ${value.length} ]`}
        defaultOpen={defaultOpen}
        path={path}
      >
        {value.map((v, i) => (
          <div key={i} className="pl-4">
            <span className="text-slate-500">{i}:</span>{' '}
            <Node value={v} open={false} path={`${path}[${i}]`} />
          </div>
        ))}
      </Collapsible>
    );
  }

  const entries = Object.entries(value);
  return (
    <Collapsible
      label={`{ ${entries.length} }`}
      defaultOpen={defaultOpen}
      path={path}
    >
      {entries.map(([k, v]) => (
        <div key={k} className="pl-4">
          <span className="text-fuchsia-300">&quot;{k}&quot;</span>
          <span className="text-slate-500">: </span>
          <Node value={v} open={false} path={`${path}.${k}`} />
        </div>
      ))}
    </Collapsible>
  );
}

function Collapsible({
  label,
  defaultOpen,
  children,
  path,
}: {
  label: string;
  defaultOpen: boolean;
  children: React.ReactNode;
  path: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer text-slate-300 hover:text-white"
        aria-label={`${path} 토글`}
      >
        {open ? '▾' : '▸'} <span className="text-slate-400">{label}</span>
      </button>
      {open && <div>{children}</div>}
    </span>
  );
}
