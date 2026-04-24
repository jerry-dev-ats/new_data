#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ENDPOINT =
  'https://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3';
const PAGE_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1500;
const OUT_PATH = resolve(ROOT, 'data/haccp-product-images.csv');

const LABEL_MAP = {
  rnum: '순번',
  prdlstReportNo: '품목보고번호',
  productGb: '축산/식품구분',
  prdlstNm: '제품명',
  rawmtrl: '원재료',
  allergy: '알레르기 유발물질',
  prdkind: '유형명',
  prdkindstate: '유형 상태',
  manufacture: '제조원',
  imgurl1: '제품이미지 URL',
  imgurl2: '포장지 이미지 URL',
};

const serviceKey =
  process.env.API_SERVICE_KEY_PUBLIC || process.env.API_SERVICE_KEY;
if (!serviceKey) {
  console.error(
    'API_SERVICE_KEY_PUBLIC (또는 API_SERVICE_KEY)가 설정되지 않았습니다. --env-file=.env.local 과 함께 실행하세요.',
  );
  process.exit(1);
}

function buildUrl(pageNo, numOfRows) {
  const u = new URL(ENDPOINT);
  u.searchParams.set('serviceKey', serviceKey);
  u.searchParams.set('returnType', 'json');
  u.searchParams.set('pageNo', String(pageNo));
  u.searchParams.set('numOfRows', String(numOfRows));
  return u;
}

async function fetchPage(pageNo, numOfRows) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(buildUrl(pageNo, numOfRows), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(30_000),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status} (page ${pageNo}): ${text.slice(0, 200)}`,
        );
      }
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        throw new Error(
          `JSON 파싱 실패 (page ${pageNo}): ${text.slice(0, 200)}`,
        );
      }
      const body = json?.response?.body ?? json?.body;
      const header = json?.response?.header ?? json?.header;
      const resultCode = header?.resultCode;
      if (resultCode && !['00', 'OK'].includes(String(resultCode))) {
        throw new Error(
          `업스트림 에러 [${resultCode}] ${header?.resultMessage ?? header?.resultMsg ?? ''}`,
        );
      }
      const rawItems = body?.items;
      const flatten = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v.flatMap(flatten);
        if (typeof v === 'object') {
          if ('item' in v) return flatten(v.item);
          return [v];
        }
        return [];
      };
      const items = flatten(rawItems);
      const totalCount = Number(body?.totalCount ?? items.length) || 0;
      return { items, totalCount };
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const wait = RETRY_BACKOFF_MS * attempt;
        console.warn(
          `page ${pageNo} 실패 (${attempt}/${MAX_RETRIES}): ${err.message} — ${wait}ms 후 재시도`,
        );
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

function toCsvField(value) {
  if (value === null || value === undefined) return '';
  const str =
    typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log('HACCP 제품이미지 API 수집 시작');
  const probe = await fetchPage(1, PAGE_SIZE);
  const total = probe.totalCount;
  if (total === 0) {
    console.warn('수집된 데이터가 없습니다.');
    return;
  }
  console.log(`총 ${total.toLocaleString()}건, 페이지당 ${PAGE_SIZE}건`);

  const allRows = [...probe.items];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  for (let page = 2; page <= totalPages; page++) {
    const { items } = await fetchPage(page, PAGE_SIZE);
    allRows.push(...items);
    console.log(
      `  page ${page}/${totalPages} — 누적 ${allRows.length.toLocaleString()}/${total.toLocaleString()}`,
    );
    if (items.length === 0) break;
  }

  if (allRows.length !== total) {
    console.warn(
      `수집 건수(${allRows.length})와 totalCount(${total}) 불일치 — 업스트림이 중간에 줄었거나 중복이 있을 수 있습니다.`,
    );
  }

  const keySet = new Set();
  for (const row of allRows) {
    if (row && typeof row === 'object') {
      for (const k of Object.keys(row)) keySet.add(k);
    }
  }
  const labeled = Object.keys(LABEL_MAP).filter((k) => keySet.has(k));
  const extras = [...keySet].filter((k) => !(k in LABEL_MAP)).sort();
  const columns = [...labeled, ...extras];
  const headerRow = columns
    .map((k) => toCsvField(LABEL_MAP[k] ? `${LABEL_MAP[k]}(${k})` : k))
    .join(',');

  const lines = [headerRow];
  for (const row of allRows) {
    lines.push(columns.map((k) => toCsvField(row?.[k])).join(','));
  }
  const csv = '﻿' + lines.join('\n') + '\n';

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, csv, 'utf8');
  console.log(`저장 완료: ${OUT_PATH}`);
  console.log(`  컬럼 ${columns.length}개, 행 ${allRows.length.toLocaleString()}건`);
}

main().catch((err) => {
  console.error('실패:', err);
  process.exit(1);
});
