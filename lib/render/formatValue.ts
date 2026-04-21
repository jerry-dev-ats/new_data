import type { JsonValue } from '@/lib/apis/types';
import type { FieldType } from './inferSchema';

export function formatDate(input: string): string {
  // YYYYMMDD, YYYY-MM-DD, YYYY.MM.DD 등 허용
  const cleaned = input.replace(/[^\d]/g, '').slice(0, 14);
  if (cleaned.length < 8) return input;
  const y = cleaned.slice(0, 4);
  const m = cleaned.slice(4, 6);
  const d = cleaned.slice(6, 8);
  if (cleaned.length >= 14) {
    const h = cleaned.slice(8, 10);
    const mi = cleaned.slice(10, 12);
    return `${y}-${m}-${d} ${h}:${mi}`;
  }
  return `${y}-${m}-${d}`;
}

export function formatNumber(input: number | string): string {
  const n = typeof input === 'string' ? Number(input) : input;
  if (!Number.isFinite(n)) return String(input);
  return n.toLocaleString('ko-KR');
}

/**
 * 1차 텍스트 요약 — 카드/테이블 셀에 표시되는 기본 문자열 값.
 * 실제 렌더링은 React 컴포넌트에서 타입별로 다르게 처리한다.
 */
export function previewText(value: JsonValue, type: FieldType): string {
  if (value === null || value === undefined) return '-';
  if (type === 'date' && typeof value === 'string') return formatDate(value);
  if (type === 'number' && typeof value === 'number')
    return formatNumber(value);
  if (type === 'numericString' && typeof value === 'string')
    return formatNumber(value);
  if (type === 'boolean') return value ? '예' : '아니오';
  if (type === 'object' && typeof value === 'object')
    return `객체 (${Object.keys(value as object).length}개 필드)`;
  if (type === 'array' && Array.isArray(value))
    return `배열 (${value.length}개 항목)`;
  if (typeof value === 'string') return value;
  return String(value);
}
