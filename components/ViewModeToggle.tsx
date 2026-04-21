'use client';

import { LayoutGrid, Table as TableIcon, Braces } from 'lucide-react';

export type ViewMode = 'card' | 'table' | 'json';

const OPTIONS: { value: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { value: 'card', label: '카드', Icon: LayoutGrid },
  { value: 'table', label: '테이블', Icon: TableIcon },
  { value: 'json', label: 'JSON', Icon: Braces },
];

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="뷰 모드 전환"
      className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm"
    >
      {OPTIONS.map(({ value: v, label, Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(v)}
            className={
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ' +
              (active
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100')
            }
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
