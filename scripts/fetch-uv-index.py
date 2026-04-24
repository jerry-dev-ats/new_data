"""자외선지수(UV Index) V4 API 전체 응답을 가져와 CSV로 저장."""

from __future__ import annotations

import csv
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json

BASE_URL = "https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4"
SERVICE_KEY = "b05147f3d70c4eca7ebc981fe292217205edea45e2c68c1ba1b17c434f8dea18"
AREA_NO = "1100000000"
REQUEST_TIME = "2026042418"
PAGE_SIZE = 1000

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "uv-index.csv"


def fetch_page(page_no: int) -> dict:
    params = {
        "serviceKey": SERVICE_KEY,
        "pageNo": page_no,
        "numOfRows": PAGE_SIZE,
        "dataType": "JSON",
        "areaNo": AREA_NO,
        "time": REQUEST_TIME,
    }
    url = f"{BASE_URL}?{urlencode(params)}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print("[!] JSON 파싱 실패. 응답 원본:", file=sys.stderr)
        print(raw, file=sys.stderr)
        raise


def extract_items(payload: dict) -> tuple[list[dict], int]:
    body = payload.get("response", {}).get("body", {})
    items = body.get("items", {})
    if isinstance(items, dict):
        item = items.get("item", [])
    else:
        item = []
    if isinstance(item, dict):
        item = [item]
    total = int(body.get("totalCount", 0) or 0)
    return item, total


def main() -> None:
    all_rows: list[dict] = []
    page_no = 1

    while True:
        print(f"[+] 페이지 {page_no} 요청 중...")
        payload = fetch_page(page_no)

        header = payload.get("response", {}).get("header", {})
        result_code = header.get("resultCode")
        if result_code != "00":
            print(f"[!] API 오류: {header}", file=sys.stderr)
            sys.exit(1)

        items, total_count = extract_items(payload)
        all_rows.extend(items)
        print(f"    - {len(items)}건 수신 (누적 {len(all_rows)} / 전체 {total_count})")

        if len(all_rows) >= total_count or not items:
            break
        page_no += 1
        time.sleep(0.2)

    if not all_rows:
        print("[!] 응답 데이터가 비어 있습니다.", file=sys.stderr)
        sys.exit(1)

    fieldnames: list[str] = []
    seen = set()
    for row in all_rows:
        for key in row.keys():
            if key not in seen:
                seen.add(key)
                fieldnames.append(key)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"[✓] 총 {len(all_rows)}건을 저장했습니다 -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
