import type { JsonObject, JsonValue } from '@/lib/apis/types';

export type FieldType =
  | 'null'
  | 'boolean'
  | 'number'
  | 'numericString'
  | 'date'
  | 'url'
  | 'image'
  | 'string'
  | 'longText'
  | 'object'
  | 'array';

export type FieldMeta = {
  key: string;
  type: FieldType;
  /** 모든 샘플에서 존재한 비율(0~1) */
  presence: number;
  sample: JsonValue;
};

export type InferredSchema = {
  fields: FieldMeta[];
  /** 카드의 주요 타이틀 후보 키 */
  titleKey: string | null;
  /** 카드의 부제 후보 키 */
  subtitleKey: string | null;
  /** 썸네일로 쓸 이미지 키 */
  imageKey: string | null;
};

const URL_RE = /^https?:\/\/\S+$/i;
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
const DATE_RE = /^\d{4}[-./]?\d{2}[-./]?\d{2}([T\s]\d{2}:\d{2})?/;
const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

const TITLE_KEYS = [
  'PRDUCT_NM',
  'PRDLST_NM',
  'PRODUCT_NAME',
  'ITEM_NAME',
  'title',
  'name',
  'prductNm',
  'itemName',
];
const SUBTITLE_KEYS = [
  'ENTP_NAME',
  'BSSH_NM',
  'entpName',
  'bsshNm',
  'company',
];
const IMAGE_KEYS = [
  'IMAGE',
  'IMAGE_URL',
  'imgUrl',
  'image',
  'thumbnail',
  'photoUrl',
];

export function classifyValue(value: JsonValue): FieldType {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value.length === 0) return 'string';
    if (URL_RE.test(value)) {
      return IMAGE_EXT_RE.test(value) ? 'image' : 'url';
    }
    if (DATE_RE.test(value)) return 'date';
    if (NUMERIC_RE.test(value)) return 'numericString';
    if (value.length > 80) return 'longText';
    return 'string';
  }
  return 'string';
}

/** 같은 키에 타입이 여러 번 등장할 때 대표 타입 선택 */
function pickDominant(types: FieldType[]): FieldType {
  const freq = new Map<FieldType, number>();
  for (const t of types) {
    if (t === 'null') continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  if (freq.size === 0) return 'string';
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function pickByCandidates(
  fields: FieldMeta[],
  candidates: string[],
): string | null {
  for (const c of candidates) {
    const hit = fields.find(
      (f) =>
        f.key === c ||
        f.key.toUpperCase() === c.toUpperCase() ||
        f.key.toLowerCase() === c.toLowerCase(),
    );
    if (hit) return hit.key;
  }
  return null;
}

export function inferSchema(
  items: JsonObject[],
  sampleSize = 10,
): InferredSchema {
  const sample = items.slice(0, sampleSize);
  if (sample.length === 0) {
    return { fields: [], titleKey: null, subtitleKey: null, imageKey: null };
  }

  const counters = new Map<
    string,
    { types: FieldType[]; count: number; firstValue: JsonValue }
  >();

  for (const item of sample) {
    for (const [k, v] of Object.entries(item)) {
      const entry = counters.get(k) ?? {
        types: [],
        count: 0,
        firstValue: v,
      };
      entry.types.push(classifyValue(v));
      entry.count += 1;
      if (entry.firstValue === undefined || entry.firstValue === null) {
        entry.firstValue = v;
      }
      counters.set(k, entry);
    }
  }

  const fields: FieldMeta[] = [...counters.entries()].map(([key, c]) => ({
    key,
    type: pickDominant(c.types),
    presence: c.count / sample.length,
    sample: c.firstValue,
  }));

  const titleKey =
    pickByCandidates(fields, TITLE_KEYS) ??
    fields.find(
      (f) => f.type === 'string' && f.presence === 1 && f.key.length <= 40,
    )?.key ??
    null;

  const subtitleKey =
    pickByCandidates(
      fields.filter((f) => f.key !== titleKey),
      SUBTITLE_KEYS,
    ) ?? null;

  const imageKey =
    fields.find((f) => f.type === 'image')?.key ??
    pickByCandidates(fields, IMAGE_KEYS) ??
    null;

  return { fields, titleKey, subtitleKey, imageKey };
}
