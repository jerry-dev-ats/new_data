import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import {
  DEFAULT_PAGE_SIZE,
  getApiById,
} from '@/lib/apis/registry';
import type {
  ApiConfig,
  JsonObject,
  JsonValue,
  NormalizedPage,
} from '@/lib/apis/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HARDCODED_CONSUMER24_KEYS: Record<string, string> = {
  CONSUMER24_FOOD_KEY: '8EMNMKH3OO',
  CONSUMER24_INDUSTRIAL_KEY: 'JJDMSXKY8K',
  CONSUMER24_LIVESTOCK_KEY: 'B2WSX03EQM',
  CONSUMER24_DRUG_KEY: 'R72LOZINOR',
  CONSUMER24_COSMETIC_KEY: 'KYGS37XAGK',
  CONSUMER24_MEDICAL_DEVICE_KEY: 'UK1DW6RCPV',
  CONSUMER24_AUTOMOBILE_KEY: 'TUCRHJSEBO',
  CONSUMER24_WATER_KEY: 'T6YDBQMYBI',
  CONSUMER24_OVERSEAS_KEY: 'O3DJG4GT9S',
};

function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);

  const cause = (err as Error & { cause?: unknown }).cause;
  if (cause && typeof cause === 'object') {
    const details = cause as {
      code?: string;
      errno?: string | number;
      syscall?: string;
      address?: string;
      port?: number;
      host?: string;
      message?: string;
    };
    const suffix = [
      details.code,
      details.errno,
      details.syscall,
      details.host ?? details.address,
      details.port,
      details.message,
    ]
      .filter(Boolean)
      .join(' / ');
    if (suffix) {
      return `${err.message} (${suffix})`;
    }
  }

  return err.message;
}

function getByPath(obj: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function toInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function asItemsArray(raw: unknown): JsonObject[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((v) => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return [];
      const record = v as Record<string, unknown>;
      const maybeItem = record.item;
      if (Array.isArray(maybeItem)) return asItemsArray(maybeItem);
      if (maybeItem && typeof maybeItem === 'object' && !Array.isArray(maybeItem)) {
        return [maybeItem as JsonObject];
      }
      return [record as JsonObject];
    });
  }
  if (raw && typeof raw === 'object') {
    const maybeItem = (raw as Record<string, unknown>).item;
    if (Array.isArray(maybeItem)) return asItemsArray(maybeItem);
    if (maybeItem && typeof maybeItem === 'object')
      return [maybeItem as JsonObject];
    return [raw as JsonObject];
  }
  return [];
}

function parseBody(rawText: string, config: ApiConfig): JsonValue {
  if (config.responseType === 'xml') {
    const arrayTags = new Set(config.arrayTags ?? []);
    const parser = new XMLParser({
      ignoreAttributes: true,
      removeNSPrefix: true,
      parseTagValue: true,
      trimValues: true,
      processEntities: true,
      isArray: (tagName) => arrayTags.has(tagName),
    });
    return parser.parse(rawText) as JsonValue;
  }
  return JSON.parse(rawText) as JsonValue;
}

function normalizeJsonKeys(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonKeys(entry as JsonValue));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key.trim(),
        normalizeJsonKeys(entry as JsonValue),
      ]),
    ) as JsonObject;
  }
  return value;
}

function buildUpstreamUrl(
  config: ApiConfig,
  incoming: URL,
  pageNo: number,
  numOfRows: number,
  serviceKey: string,
): URL {
  if (config.requestStyle === 'foodsafetykorea') {
    if (!config.serviceId) {
      throw new Error(`serviceId가 없는 foodsafetykorea API 설정: ${config.id}`);
    }

    const startIdx = (pageNo - 1) * numOfRows + 1;
    const endIdx = startIdx + numOfRows - 1;
    const base = config.endpoint.replace(/\/+$/, '');
    const dataType = config.responseType ?? 'json';
    const extraParams = [...incoming.searchParams.entries()]
      .filter(([k]) => !['pageNo', 'numOfRows', 'serviceKey'].includes(k))
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
      );

    const upstreamUrl = [
      base,
      encodeURIComponent(serviceKey),
      encodeURIComponent(config.serviceId),
      dataType,
      String(startIdx),
      String(endIdx),
      ...(extraParams.length > 0 ? [extraParams.join('&')] : []),
    ].join('/');

    return new URL(upstreamUrl);
  }

  const pageParam = config.pageParam ?? 'pageNo';
  const sizeParam = config.sizeParam ?? 'numOfRows';
  const upstream = new URL(config.endpoint);
  for (const [k, v] of Object.entries(config.defaultParams ?? {})) {
    upstream.searchParams.set(k, String(v));
  }
  for (const [k, v] of incoming.searchParams) {
    if (k === 'pageNo' || k === 'numOfRows' || k === 'serviceKey') continue;
    upstream.searchParams.set(k, v);
  }
  upstream.searchParams.set(pageParam, String(pageNo));
  upstream.searchParams.set(sizeParam, String(numOfRows));
  upstream.searchParams.set(
    config.serviceKeyParam ?? 'serviceKey',
    serviceKey,
  );

  return upstream;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const config = getApiById(id);
  if (!config) {
    return NextResponse.json(
      { error: true, message: `등록되지 않은 API id: ${id}` },
      { status: 404 },
    );
  }

  const dedicatedKey = config.serviceKeyEnv
    ? process.env[config.serviceKeyEnv] ||
      HARDCODED_CONSUMER24_KEYS[config.serviceKeyEnv]
    : undefined;
  const publicServiceKey =
    process.env.API_SERVICE_KEY_PUBLIC || process.env.API_SERVICE_KEY;
  // APIs that declare a dedicated env must use that exact key.
  // Falling back to the shared data.go.kr key masks misconfiguration on deploys.
  const serviceKey = config.serviceKeyEnv
    ? dedicatedKey
    : publicServiceKey;
  if (!serviceKey) {
    const expected = config.serviceKeyEnv
      ? config.serviceKeyEnv
      : ['API_SERVICE_KEY_PUBLIC', 'API_SERVICE_KEY'].join(' 또는 ');
    return NextResponse.json(
      {
        error: true,
        message: `서비스키 환경변수(${expected})가 설정되지 않았습니다.`,
      },
      { status: 500 },
    );
  }

  const incoming = new URL(request.url);
  const pageNo = toInt(incoming.searchParams.get('pageNo'), 1);
  const numOfRows = toInt(
    incoming.searchParams.get('numOfRows'),
    DEFAULT_PAGE_SIZE,
  );
  let upstream: URL;
  try {
    upstream = buildUpstreamUrl(
      config,
      incoming,
      pageNo,
      numOfRows,
      serviceKey,
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: true,
        message: `업스트림 URL 구성 실패: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream.toString(), {
      method: config.method ?? 'GET',
      headers: {
        Accept:
          config.responseType === 'xml'
            ? 'application/xml, text/xml;q=0.9, */*;q=0.8'
            : 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: true,
        message: `외부 API 호출 실패: ${describeFetchError(err)}`,
      },
      { status: 502 },
    );
  }

  const rawText = await upstreamRes.text();

  if (!upstreamRes.ok) {
    return NextResponse.json(
      {
        error: true,
        message: `외부 API ${upstreamRes.status} 응답`,
        upstreamStatus: upstreamRes.status,
        upstreamBody: rawText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  let parsed: JsonValue;
  try {
    parsed = normalizeJsonKeys(parseBody(rawText, config));
  } catch (err) {
    return NextResponse.json(
      {
        error: true,
        message: `응답 파싱 실패: ${err instanceof Error ? err.message : String(err)}`,
        upstreamBody: rawText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  // JSON 응답에서 흔한 { response: ... } 래퍼 자동 언랩 (식약처 표준)
  const unwrap =
    config.responseType !== 'xml' && (config.unwrapResponseRoot ?? true);
  const root =
    unwrap &&
    parsed &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    'response' in (parsed as object)
      ? (parsed as { response: unknown }).response
      : parsed;

  // 업스트림이 2xx이면서 본문에 에러 코드를 싣는 경우를 감지
  if (config.errorCheck) {
    const {
      containerPaths,
      codeKey = 'code',
      messageKey = 'codeMsg',
      successValues = ['00', '0'],
      emptyValues = [],
    } = config.errorCheck;
    for (const path of containerPaths) {
      const container = getByPath(root, path);
      if (
        container &&
        typeof container === 'object' &&
        codeKey in (container as object)
      ) {
        const code = String(
          (container as Record<string, unknown>)[codeKey] ?? '',
        );
        if (code && emptyValues.includes(code)) {
          const emptyPayload: NormalizedPage = {
            items: [],
            totalCount: 0,
            pageNo,
            numOfRows,
          };
          return NextResponse.json(emptyPayload);
        }
        if (code && !successValues.includes(code)) {
          const message = String(
            (container as Record<string, unknown>)[messageKey] ?? '업스트림 오류',
          );
          return NextResponse.json(
            {
              error: true,
              message: `업스트림 응답 에러 [${code}] ${message}`,
              upstreamBody: rawText.slice(0, 500),
            },
            { status: 502 },
          );
        }
        break;
      }
    }
  }

  const itemsRaw = getByPath(root, config.dataPath);
  const items = asItemsArray(itemsRaw);

  const totalCount = config.totalPath
    ? toInt(getByPath(root, config.totalPath), items.length)
    : items.length;

  const payload: NormalizedPage = {
    items,
    totalCount,
    pageNo,
    numOfRows,
  };

  return NextResponse.json(payload);
}
