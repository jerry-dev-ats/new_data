# 공공 API 통합 뷰어

식품의약품안전처 등 data.go.kr 공공 API 약 20건을 한 화면의 탭으로 열람하고, 응답 JSON/XML을 비개발자도 바로 읽을 수 있게 카드/테이블로 자동 정리해 주는 Next.js 앱.

## 핵심 특징

- 탭 하나당 공공 API 하나 — `lib/apis/registry.ts`에 `ApiConfig` 한 개를 추가하면 탭이 자동 생성된다.
- `/api/proxy/[id]`가 서버에서 외부 API를 대신 호출하므로 **CORS 문제 없음**, 서비스키는 **브라우저로 노출되지 않는다.**
- **JSON / XML 응답 모두 지원** (`responseType: 'xml'`이면 fast-xml-parser로 파싱 후 동일 파이프라인).
- **API별 서비스키 분리** — `serviceKeyEnv`로 API마다 다른 환경변수를 가리킬 수 있고, 비어 있으면 공통 `API_SERVICE_KEY_PUBLIC`로 폴백한다. 레거시 `API_SERVICE_KEY`도 호환된다.
- **업스트림 에러 감지** — `errorCheck.containerPaths`로 본문 내 에러 코드(`code 50` 등)를 탐지해 502 + 사람이 읽을 수 있는 메시지로 정규화.
- 무한스크롤(React Query `useInfiniteQuery` + IntersectionObserver)로 `pageNo` / `numOfRows=20`씩 이어 로드.
- 범용 렌더러가 응답을 스캔해 **날짜/URL/이미지/숫자/중첩 객체**를 자동으로 알맞게 표시.
- 카드 · 테이블 · JSON 트리 세 가지 뷰를 토글로 전환.

## 현재 등록된 API (23건)

소비자24(공정위, consumer.go.kr) 리콜 계열. 엔드포인트 하나에 `cntntsId`로 카테고리 구분:

| id | 카테고리 | cntntsId | 전용 env |
| --- | --- | --- | --- |
| `consumer-recall-industrial` | 공산품 리콜 | 0101 | `CONSUMER24_INDUSTRIAL_KEY` |
| `consumer-recall-food` | 식품 리콜 | 0201 | `CONSUMER24_FOOD_KEY` |
| `consumer-recall-livestock` | 축산물 리콜 | 0203 | `CONSUMER24_LIVESTOCK_KEY` |
| `consumer-recall-drug` | 의약품 리콜 | 0204 | `CONSUMER24_DRUG_KEY` |
| `consumer-recall-cosmetic` | 화장품 리콜 | 0206 | `CONSUMER24_COSMETIC_KEY` |
| `consumer-recall-medical-device` | 의료기기 리콜 | 0207 | `CONSUMER24_MEDICAL_DEVICE_KEY` |
| `consumer-recall-automobile` | 자동차 리콜 | 0301 | `CONSUMER24_AUTOMOBILE_KEY` |
| `consumer-recall-water` | 먹는 물 리콜 | 0403 | `CONSUMER24_WATER_KEY` |
| `consumer-recall-overseas` | 해외 리콜 | 0501 | `CONSUMER24_OVERSEAS_KEY` |

> 소비자24 API는 **카테고리별로 서비스키가 따로 발급**됩니다. data.go.kr에서 각 리콜 데이터를 활용신청하고 발급받은 키를 위 환경변수에 넣어주세요. 값이 비어 있으면 `API_SERVICE_KEY_PUBLIC`이 우선 폴백되고, 없으면 `API_SERVICE_KEY`가 사용됩니다.

추가 등록된 공공데이터포털 API:

| 분류 | id | API명 |
| --- | --- | --- |
| 식품 | `haccp-product-images` | 한국식품안전관리인증원_HACCP 제품이미지 및 포장지표기정보 |
| 식품 | `imported-food-recall-stop` | 식품의약품안전처_수입식품 회수판매중지 제품 정보 |
| 식품 | `agricultural-product-test-failures` | 식품의약품안전처_검사부적합 현황(농산물) |
| 의약품 | `easy-drug-info` | 식품의약품안전처_의약품개요정보(e약은요) |
| 의약품 | `dur-prdlst-info` | 식품의약품안전처_의약품안전사용서비스(DUR) 품목정보 |
| 의약품 | `dur-ingredient-info` | 식품의약품안전처_의약품안전사용서비스(DUR) 성분정보 |
| 의약품 | `drug-administrative-disposition` | 식품의약품안전처_의약품 행정처분 정보 |
| 화장품 | `cosmetic-regulation-info` | 식품의약품안전처_화장품 규제정보 |
| 화장품 | `cosmetic-recall-stop` | 식품의약품안전처_화장품 회수·판매중지 정보 |
| 화장품 | `functional-cosmetic-report-items` | 식품의약품안전처_기능성화장품 보고품목정보 |

> 위 10개 API는 모두 공용 `API_SERVICE_KEY_PUBLIC`를 사용하도록 연결되어 있습니다. 레거시 `API_SERVICE_KEY`도 호환됩니다. 실제 호출이 성공하려면 공공데이터포털에서 각 데이터셋 활용승인이 되어 있어야 합니다.

추가 등록된 식품안전나라 OpenAPI:

| 분류 | id | API명 |
| --- | --- | --- |
| 식품 | `foodsafety-recall-sale-stop` | 회수·판매중지 정보 (`I0490`) |
| 식품 | `foodsafety-domestic-test-failures` | 식품의약품안전처_검사부적합(국내) (`I2620`) |
| 식품 | `foodsafety-hf-functional-material-status` | 식품의약품안전처_건강기능식품 기능성 원료인정 현황 (`I-0040`) |
| 식품 | `foodsafety-hf-individual-approved-info` | 식품의약품안전처_건강기능식품 개별인정형 정보 (`I-0050`) |

> 위 4개 API는 식품안전나라 전용 인증키 `API_SERVICE_KEY_FOOD`를 사용합니다. `data.go.kr` 키와는 별개입니다.

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # 그리고 API_SERVICE_KEY_PUBLIC 값을 채운다
npm run dev
# http://localhost:3000
```

## 새 API 추가하는 법

1. `lib/apis/definitions/<your-api>.ts` 생성.
   ```ts
   import type { ApiConfig } from '../types';

   export const yourApi: ApiConfig = {
     id: 'your-api',                 // 영문 kebab-case
     title: '표시 제목',
     category: '카테고리 · 소분류',
     endpoint: 'https://apis.data.go.kr/.../your-operation',
     defaultParams: { type: 'json' },  // 대부분의 공공 API가 JSON 응답을 위해 필요
     dataPath: ['body', 'items'],      // 응답에서 배열 추출 경로
     totalPath: ['body', 'totalCount'],
     // labelMap: { FOO: '바' },       // 필드명 한글 매핑(선택)
   };
   ```
2. `lib/apis/registry.ts`에 import하고 `API_REGISTRY` 배열에 추가.
3. 끝. `npm run dev`로 확인.

## 디렉토리

```
app/
  layout.tsx / providers.tsx / page.tsx
  api/proxy/[id]/route.ts       # 서버 프록시 (서비스키 주입 + 정규화)
components/
  ApiTabs.tsx / ApiPanel.tsx    # 탭 + 무한스크롤
  ItemCard.tsx / ItemTable.tsx / JsonTree.tsx
  ViewModeToggle.tsx / FieldValue.tsx
lib/
  apis/
    types.ts / registry.ts
    definitions/*.ts             # 각 공공 API 설정
  render/
    inferSchema.ts                # 응답 구조 자동 추론
    formatValue.ts                # 값 포맷
    labelMap.ts                   # 영문 키 → 한글 라벨 사전
```

## 에러 처리

- 프록시는 외부 API 5xx/타임아웃/JSON 파싱 실패를 502로 정규화해 메시지를 돌려준다.
- 화면 상단의 빨간 카드로 원인과 힌트가 표시된다.

## 한계

- data.go.kr의 일부 API는 초당 호출 제한이 있다. 무한스크롤을 빠르게 내리면 throttling에 걸릴 수 있으니 초기 개발 시에는 `numOfRows`를 줄이거나 `API_REGISTRY`를 소규모로 유지한다.
- 일부 API는 `items.item` 구조(배열이 때로 단건 객체로 변형)로 내려오는데, 프록시가 자동으로 펼쳐준다. 더 이질적인 응답은 `dataPath`를 직접 맞추면 된다.

# new_data
