"""AirKorea 대기오염정보 API 요청을 보내 응답을 CSV로 저장.

airkorea.md 문서에 기재된 두 가지 요청을 전국 범위로 실행한다.
1. 시도별 실시간 측정정보 조회 (getCtprvnRltmMesureDnsty) — sidoName=전국 전체 페이지
2. 측정소별 실시간 측정정보 조회 (getMsrstnAcctoRltmMesureDnsty)
   — 위 응답에서 수집한 모든 측정소를 순회

공공 API rate-limit(HTTP 429) 회피:
- 측정소 호출 간 REQUEST_INTERVAL(초) 만큼 대기.
- 429 응답 시 지수 백오프로 최대 REQUEST_MAX_BACKOFF 까지 대기.
- 측정소별 결과는 스트리밍 방식으로 CSV에 append → 중단돼도 재실행 시 남은 측정소만 재개.
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc"
SERVICE_KEY = "b05147f3d70c4eca7ebc981fe292217205edea45e2c68c1ba1b17c434f8dea18"
PAGE_SIZE = 1000
REQUEST_INTERVAL = 0.25
REQUEST_RETRIES = 6
REQUEST_MAX_BACKOFF = 120.0

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SIDO_CSV = DATA_DIR / "airkorea-sido-all.csv"
STATION_CSV = DATA_DIR / "airkorea-station-all.csv"
STATION_FIELDS = [
    "stationName",
    "dataTime",
    "mangName",
    "so2Value",
    "coValue",
    "o3Value",
    "no2Value",
    "pm10Value",
    "pm10Value24",
    "pm25Value",
    "pm25Value24",
    "khaiValue",
    "khaiGrade",
    "so2Grade",
    "coGrade",
    "o3Grade",
    "no2Grade",
    "pm10Grade",
    "pm25Grade",
    "pm10Grade1h",
    "pm25Grade1h",
    "so2Flag",
    "coFlag",
    "o3Flag",
    "no2Flag",
    "pm10Flag",
    "pm25Flag",
]


def sleep_for(seconds: float) -> None:
    if seconds > 0:
        time.sleep(seconds)


def fetch(endpoint: str, params: dict) -> dict:
    url = f"{BASE_URL}/{endpoint}?{urlencode({'serviceKey': SERVICE_KEY, **params})}"
    last_err: Exception | None = None
    for attempt in range(REQUEST_RETRIES):
        try:
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
            return json.loads(raw)
        except HTTPError as err:
            last_err = err
            if err.code == 429:
                wait = min(REQUEST_MAX_BACKOFF, 4.0 * (2 ** attempt))
                print(f"    [429] {endpoint} retry {attempt + 1}/{REQUEST_RETRIES} after {wait:.1f}s")
                sleep_for(wait)
                continue
            sleep_for(1.0 * (attempt + 1))
        except (URLError, TimeoutError, json.JSONDecodeError) as err:
            last_err = err
            sleep_for(1.0 * (attempt + 1))
    raise RuntimeError(f"요청 실패: {endpoint} {params} -> {last_err}")


def extract_items(payload: dict) -> list[dict]:
    body = payload.get("response", {}).get("body", {})
    items = body.get("items", [])
    if isinstance(items, dict):
        items = items.get("item", [])
    if isinstance(items, dict):
        items = [items]
    return items or []


def total_count(payload: dict) -> int:
    body = payload.get("response", {}).get("body", {})
    try:
        return int(body.get("totalCount", 0))
    except (TypeError, ValueError):
        return 0


def save_csv(items: list[dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if not items:
        print(f"[!] 항목이 없어 CSV를 저장하지 않습니다: {output_path}")
        return

    headers: list[str] = []
    seen: set[str] = set()
    for item in items:
        for key in item.keys():
            if key not in seen:
                seen.add(key)
                headers.append(key)

    with output_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for item in items:
            writer.writerow({h: item.get(h, "") for h in headers})
    print(f"[OK] 저장 완료: {output_path} ({len(items)}건)")


def fetch_sido_all() -> list[dict]:
    all_items: list[dict] = []
    page = 1
    while True:
        params = {
            "returnType": "json",
            "numOfRows": str(PAGE_SIZE),
            "pageNo": str(page),
            "sidoName": "전국",
            "ver": "1.0",
        }
        payload = fetch("getCtprvnRltmMesureDnsty", params)
        items = extract_items(payload)
        total = total_count(payload)
        all_items.extend(items)
        print(f"  [sido] page {page}: {len(items)}건 (누적 {len(all_items)}/{total})")
        sleep_for(REQUEST_INTERVAL)
        if not items or len(all_items) >= total:
            break
        page += 1
    return all_items


def fetch_station_daily(station_name: str) -> list[dict]:
    all_items: list[dict] = []
    page = 1
    while True:
        params = {
            "returnType": "json",
            "numOfRows": str(PAGE_SIZE),
            "pageNo": str(page),
            "stationName": station_name,
            "dataTerm": "DAILY",
            "ver": "1.0",
        }
        payload = fetch("getMsrstnAcctoRltmMesureDnsty", params)
        items = extract_items(payload)
        total = total_count(payload)
        for item in items:
            item["stationName"] = station_name
        all_items.extend(items)
        sleep_for(REQUEST_INTERVAL)
        if not items or len(all_items) >= total:
            break
        page += 1
    return all_items


def load_station_names_from_sido_csv() -> list[str]:
    with SIDO_CSV.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    return sorted({
        (r.get("stationName") or "").strip()
        for r in rows
        if (r.get("stationName") or "").strip()
    })


def load_done_stations() -> set[str]:
    if not STATION_CSV.exists():
        return set()
    done: set[str] = set()
    with STATION_CSV.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("stationName") or "").strip()
            if name:
                done.add(name)
    return done


def open_station_writer():
    """stationName 컬럼을 고정 헤더로 고정하고, 기존 파일이 있으면 append."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    new_file = not STATION_CSV.exists() or STATION_CSV.stat().st_size == 0
    f = STATION_CSV.open("a", encoding="utf-8-sig", newline="")
    writer = csv.DictWriter(f, fieldnames=STATION_FIELDS, extrasaction="ignore")
    if new_file:
        writer.writeheader()
        f.flush()
    return f, writer


def main() -> None:
    if SIDO_CSV.exists() and not os.environ.get("FORCE_SIDO"):
        print(f"[1/2] 시도(전국) CSV 이미 존재 — 재사용: {SIDO_CSV}")
    else:
        print("[1/2] 시도별(전국) 실시간 측정정보 조회")
        sido_items = fetch_sido_all()
        save_csv(sido_items, SIDO_CSV)

    station_names = load_station_names_from_sido_csv()
    done = load_done_stations()
    remaining = [n for n in station_names if n not in done]
    print(
        f"[2/2] 측정소별 실시간 측정정보 조회 — 총 {len(station_names)}개 "
        f"(완료 {len(done)}, 남은 {len(remaining)})"
    )

    f, writer = open_station_writer()
    failures: list[str] = []
    try:
        for idx, name in enumerate(remaining, 1):
            try:
                items = fetch_station_daily(name)
                for item in items:
                    writer.writerow(item)
                f.flush()
                print(f"  ({idx}/{len(remaining)}) {name}: {len(items)}건")
            except Exception as err:
                failures.append(name)
                print(f"  ({idx}/{len(remaining)}) {name}: 실패 - {err}", file=sys.stderr)
    finally:
        f.close()

    if failures:
        print(f"[!] 실패한 측정소 {len(failures)}개: {', '.join(failures)}", file=sys.stderr)
    else:
        print("[OK] 모든 측정소 수집 완료")


if __name__ == "__main__":
    main()
