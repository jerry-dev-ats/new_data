"""기상청 생활기상지수(V4) 조회서비스 4종을 모두 요청해 CSV로 저장.

엔드포인트:
    1) getFreezeIdxV4       동파가능지수
    2) getUVIdxV4           자외선지수
    3) getAirDiffusionIdxV4 대기확산지수
    4) getSenTaIdxV4        체감온도(여름철) — 8개 requestCode 전부
"""

from __future__ import annotations

import csv
import json
import sys
import time as _time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4"
SERVICE_KEY = "b05147f3d70c4eca7ebc981fe292217205edea45e2c68c1ba1b17c434f8dea18"
AREA_NO = "1100000000"
REQUEST_TIME = "2026042418"
PAGE_SIZE = 1000

SENTA_REQUEST_CODES = [
    ("A41", "노인"),
    ("A42", "어린이"),
    ("A44", "농촌"),
    ("A45", "비닐하우스"),
    ("A46", "취약거주환경"),
    ("A47", "도로"),
    ("A48", "건설현장"),
    ("A49", "조선소"),
]

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def fetch(operation: str, page_no: int, extra: dict | None = None) -> dict | None:
    params = {
        "serviceKey": SERVICE_KEY,
        "pageNo": page_no,
        "numOfRows": PAGE_SIZE,
        "dataType": "JSON",
        "areaNo": AREA_NO,
        "time": REQUEST_TIME,
    }
    if extra:
        params.update(extra)

    url = f"{BASE_URL}/{operation}?{urlencode(params)}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
    except HTTPError as e:
        print(f"    [!] HTTP {e.code}: {operation} 엔드포인트를 사용할 수 없음", file=sys.stderr)
        return None
    except URLError as e:
        print(f"    [!] 네트워크 오류: {e.reason}", file=sys.stderr)
        return None

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print(f"    [!] {operation} JSON 파싱 실패:", file=sys.stderr)
        print(raw[:500], file=sys.stderr)
        return None


def extract(payload: dict) -> tuple[list[dict], int, dict]:
    response = payload.get("response", {}) or {}
    header = response.get("header", {}) or {}
    body = response.get("body", {}) or {}
    items = body.get("items", {}) or {}
    item = items.get("item", []) if isinstance(items, dict) else []
    if isinstance(item, dict):
        item = [item]
    total = int(body.get("totalCount", 0) or 0)
    return item, total, header


def collect(operation: str, extra: dict | None = None) -> list[dict]:
    rows: list[dict] = []
    page_no = 1
    while True:
        payload = fetch(operation, page_no, extra)
        if payload is None:
            return rows
        items, total, header = extract(payload)
        result_code = header.get("resultCode")
        if result_code != "00":
            msg = header.get("resultMsg", "알 수 없는 오류")
            print(f"    [!] API 응답 코드 {result_code}: {msg}", file=sys.stderr)
            return rows
        if extra:
            for it in items:
                it.setdefault("_requestCode", extra.get("requestCode", ""))
        rows.extend(items)
        print(
            f"    - page {page_no}: {len(items)}건 (누적 {len(rows)} / 전체 {total})"
        )
        if len(rows) >= total or not items:
            break
        page_no += 1
        _time.sleep(0.2)
    return rows


def save_csv(filename: str, rows: list[dict]) -> Path:
    out_path = DATA_DIR / filename
    if not rows:
        print(f"[!] {filename}: 저장할 데이터가 없습니다.", file=sys.stderr)
        return out_path

    fieldnames: list[str] = []
    seen: set[str] = set()
    for row in rows:
        for key in row.keys():
            if key not in seen:
                seen.add(key)
                fieldnames.append(key)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[✓] {filename}: {len(rows)}건 저장 -> {out_path}")
    return out_path


def main() -> None:
    print(f"[설정] areaNo={AREA_NO}, time={REQUEST_TIME}")

    operations = [
        ("getFreezeIdxV4", "freeze-idx.csv", "동파가능지수", None),
        ("getUVIdxV4", "uv-idx.csv", "자외선지수", None),
        ("getAirDiffusionIdxV4", "air-diffusion-idx.csv", "대기확산지수", None),
    ]

    summary: list[tuple[str, str, int]] = []

    for op, filename, label, extra in operations:
        print(f"\n[+] {label} ({op}) 요청")
        rows = collect(op, extra)
        save_csv(filename, rows)
        summary.append((label, filename, len(rows)))
        _time.sleep(0.3)

    print(f"\n[+] 체감온도(여름철) getSenTaIdxV4 요청 - {len(SENTA_REQUEST_CODES)}개 대상")
    senta_all: list[dict] = []
    for code, name in SENTA_REQUEST_CODES:
        print(f"  > requestCode={code} ({name})")
        rows = collect("getSenTaIdxV4", {"requestCode": code})
        for r in rows:
            r["_requestCodeName"] = name
        senta_all.extend(rows)
        _time.sleep(0.3)
    save_csv("sen-ta-idx.csv", senta_all)
    summary.append(("체감온도(여름철)", "sen-ta-idx.csv", len(senta_all)))

    print("\n========== 요약 ==========")
    for label, filename, n in summary:
        status = f"{n}건" if n else "데이터 없음 (엔드포인트 미제공 또는 비제공 기간)"
        print(f"  - {label:<16} data/{filename}: {status}")
    print("==========================")


if __name__ == "__main__":
    main()
