<!-- @format -->

# AirKorea 대기오염정보 API CSV 요청/변환 가이드

## 1. 기본 안내

제공된 API 문서 기준으로 `returnType`은 `xml` 또는 `json`만 지원합니다.

따라서 **CSV를 직접 요청하는 방식은 문서상 지원되지 않으며**, 일반적으로는 다음 흐름으로 사용합니다.

```txt
API 요청(returnType=json) → JSON 응답 수신 → 필요한 필드만 추출 → CSV 파일로 변환
```

---

## 2. 기본 요청 URL

```txt
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc
```

---

## 3. 측정소별 실시간 측정정보 조회

### 기능 설명

측정소명과 측정데이터 기간을 기준으로 해당 측정소의 일반 항목 측정정보를 조회합니다.

### Endpoint

```txt
/getMsrstnAcctoRltmMesureDnsty
```

### 전체 요청 URL 형식

```txt
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty
```

### Request Parameters

| 파라미터      | 필수 여부 | 예시              | 설명                                         |
| ------------- | --------: | ----------------- | -------------------------------------------- |
| `serviceKey`  |      필수 | `발급받은_인증키` | 공공데이터포털에서 받은 인증키               |
| `returnType`  |      선택 | `json`            | 응답 형식. `xml` 또는 `json`                 |
| `numOfRows`   |      선택 | `100`             | 한 페이지 결과 수                            |
| `pageNo`      |      선택 | `1`               | 페이지 번호                                  |
| `stationName` |      필수 | `종로구`          | 측정소 이름                                  |
| `dataTerm`    |      선택 | `DAILY`           | 요청 데이터 기간. `DAILY`, `MONTH`, `3MONTH` |
| `ver`         |      선택 | `1.0`             | 버전                                         |

### JSON 요청 예시

> `serviceKey`는 실제 발급받은 인증키로 교체해야 합니다.

```txt
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?serviceKey=YOUR_SERVICE_KEY&returnType=json&numOfRows=100&pageNo=1&stationName=종로구&dataTerm=DAILY&ver=1.0
```

### URL 인코딩 요청 예시

한글 파라미터는 인코딩해서 요청하는 것이 안전합니다.

```txt
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?serviceKey=YOUR_SERVICE_KEY&returnType=json&numOfRows=100&pageNo=1&stationName=%EC%A2%85%EB%A1%9C%EA%B5%AC&dataTerm=DAILY&ver=1.0
```

---

## 4. 시도별 실시간 측정정보 조회

### 기능 설명

시도명을 검색조건으로 하여 시도별 측정소 목록에 대한 일반 항목, CAI 최종 실시간 측정값, 지수 정보를 조회합니다.

### Endpoint

```txt
/getCtprvnRltmMesureDnsty
```

### 전체 요청 URL 형식

```txt
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty
```

### Request Parameters

| 파라미터     | 필수 여부 | 예시              | 설명                           |
| ------------ | --------: | ----------------- | ------------------------------ |
| `serviceKey` |      필수 | `발급받은_인증키` | 공공데이터포털에서 받은 인증키 |
| `returnType` |      선택 | `json`            | 응답 형식. `xml` 또는 `json`   |
| `numOfRows`  |      선택 | `100`             | 한 페이지 결과 수              |
| `pageNo`     |      선택 | `1`               | 페이지 번호                    |
| `sidoName`   |      필수 | `서울`            | 시도 이름                      |
| `ver`        |      선택 | `1.0`             | 버전                           |

### `sidoName` 사용 가능 값

```txt
전국, 서울, 부산, 대구, 인천, 광주, 대전, 울산, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주, 세종
```

### JSON 요청 예시

```txt
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=YOUR_SERVICE_KEY&returnType=json&numOfRows=100&pageNo=1&sidoName=서울&ver=1.0
```

### URL 인코딩 요청 예시

```txt
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=YOUR_SERVICE_KEY&returnType=json&numOfRows=100&pageNo=1&sidoName=%EC%84%9C%EC%9A%B8&ver=1.0
```

---

## 5. 대기질 예보통보 조회

제공된 표의 `searchDate`, `InformCode`, `informGrade`, `imageUrl` 등의 응답 항목은 대기질 예보통보 조회 계열 API에서 사용하는 형태입니다.

> 실제 endpoint 이름은 제공된 내용에 명시되어 있지 않으므로, 사용하는 API 문서에서 해당 endpoint를 확인해야 합니다.

### Request Parameters

| 국문명            | 파라미터     | 필수 여부 | 예시              | 설명                           |
| ----------------- | ------------ | --------: | ----------------- | ------------------------------ |
| 서비스키          | `serviceKey` |      필수 | `발급받은_인증키` | 공공데이터포털에서 받은 인증키 |
| 데이터표출방식    | `returnType` |      선택 | `json`            | `xml` 또는 `json`              |
| 한 페이지 결과 수 | `numOfRows`  |      선택 | `100`             | 한 페이지 결과 수              |
| 페이지 번호       | `pageNo`     |      선택 | `1`               | 페이지 번호                    |
| 조회 날짜         | `searchDate` |      선택 | `2020-11-14`      | 통보시간 검색                  |
| 통보코드          | `InformCode` |      선택 | `PM10`            | `PM10`, `PM25`, `O3`           |

### 주요 Response Fields

| 국문명       | 필드명          | 예시                                       | 설명                    |
| ------------ | --------------- | ------------------------------------------ | ----------------------- |
| 결과코드     | `resultCode`    | `00`                                       | 결과 코드               |
| 결과메시지   | `resultMsg`     | `NORMAL SERVICE`                           | 결과 메시지             |
| 전체 결과 수 | `totalCount`    | `8`                                        | 전체 결과 수            |
| 통보시간     | `dataTime`      | `2020-11-13 11시 발표`                     | 통보시간                |
| 통보코드     | `informCode`    | `PM10`                                     | 통보코드                |
| 예보개황     | `informOverall` | `○[미세먼지] ...`                          | 예보개황                |
| 발생원인     | `informCause`   | `○[미세먼지] ...`                          | 발생원인                |
| 예보등급     | `informGrade`   | `서울: 나쁨, 제주: 나쁨...`                | 예보등급                |
| 행동요령     | `actionKnack`   | `-`                                        | 행동요령                |
| 이미지 URL 1 | `imageUrl1`     | `https://www.airkorea.or.kr/dustImage/...` | 예측모델 결과사진       |
| 이미지 URL 2 | `imageUrl2`     | `https://www.airkorea.or.kr/dustImage/...` | 예측모델 결과사진       |
| 이미지 URL 3 | `imageUrl3`     | `https://www.airkorea.or.kr/dustImage/...` | 예측모델 결과사진       |
| 이미지 URL 4 | `imageUrl4`     | `https://www.airkorea.or.kr/dustImage/...` | 예측모델 결과사진       |
| 이미지 URL 5 | `imageUrl5`     | `https://www.airkorea.or.kr/dustImage/...` | 예측모델 결과사진       |
| 이미지 URL 6 | `imageUrl6`     | `https://www.airkorea.or.kr/dustImage/...` | 예측모델 결과사진       |
| 이미지 URL 7 | `imageUrl7`     | `https://www.airkorea.or.kr/dustImage/...` | PM10 애니메이션 이미지  |
| 이미지 URL 8 | `imageUrl8`     | `https://www.airkorea.or.kr/dustImage/...` | PM2.5 애니메이션 이미지 |
| 이미지 URL 9 | `imageUrl9`     | `https://www.airkorea.or.kr/dustImage/...` | O3 애니메이션 이미지    |
| 예측통보시간 | `informData`    | `2020-11-14`                               | 예측통보시간            |

---

## 6. CSV로 변환하는 JavaScript 예시

아래 코드는 API에서 JSON을 받아온 뒤 `items` 배열을 CSV 문자열로 변환하는 예시입니다.

```js
const SERVICE_KEY = "YOUR_SERVICE_KEY";

const BASE_URL =
  "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty";

const params = new URLSearchParams({
  serviceKey: SERVICE_KEY,
  returnType: "json",
  numOfRows: "100",
  pageNo: "1",
  sidoName: "서울",
  ver: "1.0",
});

async function fetchAirQualityData() {
  const response = await fetch(`${BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data = await response.json();

  // 공공데이터 API 응답 구조는 보통 response.body.items 형태입니다.
  const items = data.response?.body?.items ?? [];

  return items;
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  // 쉼표, 줄바꿈, 큰따옴표가 있는 경우 CSV 규칙에 맞게 큰따옴표로 감쌉니다.
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function convertToCsv(items) {
  if (items.length === 0) return "";

  const headers = Object.keys(items[0]);

  const csvRows = [
    headers.join(","),
    ...items.map((item) =>
      headers.map((header) => escapeCsvValue(item[header])).join(","),
    ),
  ];

  return csvRows.join("\n");
}

async function main() {
  const items = await fetchAirQualityData();
  const csv = convertToCsv(items);

  console.log(csv);
}

main().catch(console.error);
```

---

## 7. 브라우저에서 CSV 파일 다운로드하기

프론트엔드에서 CSV 파일을 바로 다운로드하려면 아래처럼 사용할 수 있습니다.

```js
function downloadCsv(csv, filename = "air-quality-data.csv") {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
```

사용 예시:

```js
async function handleDownloadCsv() {
  const items = await fetchAirQualityData();
  const csv = convertToCsv(items);

  downloadCsv(csv, "seoul-air-quality.csv");
}
```

---

## 8. Node.js에서 CSV 파일로 저장하기

Node.js 환경에서는 `fs.writeFileSync`를 사용해서 CSV 파일을 저장할 수 있습니다.

```js
import fs from "fs";

async function saveCsvFile() {
  const items = await fetchAirQualityData();
  const csv = convertToCsv(items);

  fs.writeFileSync("air-quality-data.csv", "\uFEFF" + csv, "utf-8");
}

saveCsvFile().catch(console.error);
```

---

## 9. 측정소별 조회용 코드로 바꾸기

시도별 조회가 아니라 측정소별 조회를 사용하려면 `BASE_URL`과 `params`를 아래처럼 바꾸면 됩니다.

```js
const BASE_URL =
  "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";

const params = new URLSearchParams({
  serviceKey: SERVICE_KEY,
  returnType: "json",
  numOfRows: "100",
  pageNo: "1",
  stationName: "종로구",
  dataTerm: "DAILY",
  ver: "1.0",
});
```

---

## 10. 정리

CSV 파일이 필요한 경우 핵심은 다음과 같습니다.

```txt
1. returnType=json으로 API 요청
2. data.response.body.items 배열 추출
3. Object.keys(items[0])로 CSV 헤더 생성
4. 각 item 값을 쉼표로 연결
5. Blob 또는 fs를 사용해서 .csv 파일로 저장
```
