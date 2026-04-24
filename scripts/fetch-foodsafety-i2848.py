from __future__ import annotations

import math
import os
import time
from pathlib import Path
from urllib.parse import quote

import pandas as pd
import requests


BASE_URL = "http://openapi.foodsafetykorea.go.kr/api"
API_KEY = os.getenv("FOODSAFETY_API_KEY", "sample")
SERVICE_ID = "I2848"
DATA_TYPE = "json"
PAGE_SIZE = 1000

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_CSV = PROJECT_ROOT / "data" / "foodsafety-i2848-all.csv"

FILTERS: dict[str, str | None] = {
    "OCCRNC_YEAR": None,
    "OCCRNC_MM": None,
    "OCCRNC_AREA": None,
}

# 기본 User-Agent는 서버에서 제한된 응답을 주므로 브라우저 계열로 지정
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


def build_filter_path(filters: dict) -> str:
    active_filters = {
        key: value
        for key, value in filters.items()
        if value is not None and str(value).strip() != ""
    }

    if not active_filters:
        return ""

    query = "&".join(
        f"{key}={quote(str(value))}" for key, value in active_filters.items()
    )

    return f"/{query}"


def build_url(start_idx: int, end_idx: int, filters: dict | None = None) -> str:
    filter_path = build_filter_path(filters or {})

    return (
        f"{BASE_URL}/{API_KEY}/{SERVICE_ID}/{DATA_TYPE}/"
        f"{start_idx}/{end_idx}{filter_path}"
    )


def request_api(start_idx: int, end_idx: int, filters: dict | None = None) -> dict:
    url = build_url(start_idx, end_idx, filters)

    response = requests.get(url, timeout=20, headers=REQUEST_HEADERS)
    response.raise_for_status()

    return response.json()


def parse_response(data: dict) -> tuple[int, list[dict]]:
    if SERVICE_ID not in data:
        result = data.get("RESULT") or data.get("result") or {}
        code = result.get("CODE") or result.get("code")
        message = result.get("MSG") or result.get("msg")
        raise RuntimeError(
            f"API 응답에 {SERVICE_ID} 데이터가 없습니다. code={code}, message={message}"
        )

    body = data[SERVICE_ID]

    result = body.get("RESULT", {})
    code = result.get("CODE")
    message = result.get("MSG")

    if code and code != "INFO-000":
        raise RuntimeError(f"API 오류 발생: code={code}, message={message}")

    total_count = int(body.get("total_count", 0))
    rows = body.get("row", []) or []

    return total_count, rows


def fetch_all_rows() -> list[dict]:
    first_data = request_api(1, PAGE_SIZE, FILTERS)
    total_count, first_rows = parse_response(first_data)

    all_rows = first_rows[:]

    if total_count == 0:
        return all_rows

    total_pages = math.ceil(total_count / PAGE_SIZE)
    print(f"전체 데이터 수: {total_count}")
    print(f"전체 페이지 수: {total_pages}")
    print(f"1/{total_pages} 페이지 수집 완료: 현재 {len(all_rows)}건")

    for page in range(2, total_pages + 1):
        start_idx = (page - 1) * PAGE_SIZE + 1
        end_idx = page * PAGE_SIZE

        data = request_api(start_idx, end_idx, FILTERS)
        _, rows = parse_response(data)
        all_rows.extend(rows)

        print(f"{page}/{total_pages} 페이지 수집 완료: 현재 {len(all_rows)}건")

        time.sleep(0.2)

    return all_rows


def save_rows_to_csv(rows: list[dict], output_csv: Path) -> None:
    if not rows:
        print("저장할 데이터가 없습니다.")
        return

    df = pd.DataFrame(rows)

    preferred_columns = [
        "OCCRNC_YEAR",
        "OCCRNC_MM",
        "OCCRNC_AREA",
        "OCCRNC_CNT",
        "PATNT_CNT",
    ]

    ordered_columns = [col for col in preferred_columns if col in df.columns]
    extra_columns = [col for col in df.columns if col not in ordered_columns]
    df = df[ordered_columns + extra_columns]

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"CSV 저장 완료: {output_csv}")
    print(f"저장된 행 수: {len(df)}")
    print(f"저장된 컬럼: {list(df.columns)}")


if __name__ == "__main__":
    rows = fetch_all_rows()
    save_rows_to_csv(rows, OUTPUT_CSV)
