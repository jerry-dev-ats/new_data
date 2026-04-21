import type { ApiConfig } from '../types';

/**
 * 소비자24(consumer.go.kr) 리콜 계열 API.
 * 엔드포인트 하나에 cntntsId로 리콜 종류가 갈린다.
 *
 * 응답은 XML — <selectCntntsForOpenAPIResponse><channel><return>
 *   <allCnt>…</allCnt>
 *   <content>…</content> (반복)
 * </return></channel></…>
 */

const SHARED: Omit<ApiConfig, 'id' | 'title' | 'defaultParams'> = {
  category: '소비자24 · 리콜',
  endpoint: 'https://www.consumer.go.kr/openapi/contents/index.do',
  responseType: 'xml',
  arrayTags: ['content'],
  pageParam: 'pageNo',
  sizeParam: 'cntPerPage',
  dataPath: [
    'selectCntntsForOpenAPIResponse',
    'channel',
    'return',
    'content',
  ],
  totalPath: [
    'selectCntntsForOpenAPIResponse',
    'channel',
    'return',
    'allCnt',
  ],
  errorCheck: {
    // 정상 응답: selectCntntsForOpenAPIResponse.channel.return
    // 에러 응답: selectCntntsForOpenAPIResponse.return (channel 없음)
    containerPaths: [
      ['selectCntntsForOpenAPIResponse', 'channel', 'return'],
      ['selectCntntsForOpenAPIResponse', 'return'],
    ],
    codeKey: 'code',
    messageKey: 'codeMsg',
    // fast-xml-parser가 '00' → 숫자 0으로 파싱할 수 있어 두 형태 모두 허용
    successValues: ['00', '0'],
    // code 30("데이터없음")은 에러가 아니라 빈 결과로 취급
    emptyValues: ['30'],
  },
  labelMap: {
    infoId: '정보ID',
    cntntsId: '컨텐츠ID',
    infoSj: '제목',
    infoDcSumry: '요약',
    infoDetailCn: '상세내용',
    infoOrigin: '출처기관',
    infoUrl: '원문링크',
  },
};

type RecallSpec = {
  id: string;
  title: string;
  cntntsId: string;
  /** 카테고리별 서비스키가 별도이므로 각 API에 전용 env 이름을 지정 */
  serviceKeyEnv: string;
};

const RECALL_SPECS: RecallSpec[] = [
  { id: 'consumer-recall-industrial', title: '공정위 · 공산품 리콜 정보', cntntsId: '0101', serviceKeyEnv: 'CONSUMER24_INDUSTRIAL_KEY' },
  { id: 'consumer-recall-food', title: '공정위 · 식품 리콜 정보', cntntsId: '0201', serviceKeyEnv: 'CONSUMER24_FOOD_KEY' },
  { id: 'consumer-recall-livestock', title: '공정위 · 축산물 리콜 정보', cntntsId: '0203', serviceKeyEnv: 'CONSUMER24_LIVESTOCK_KEY' },
  { id: 'consumer-recall-drug', title: '공정위 · 의약품 리콜 정보', cntntsId: '0204', serviceKeyEnv: 'CONSUMER24_DRUG_KEY' },
  { id: 'consumer-recall-cosmetic', title: '공정위 · 화장품 리콜 정보', cntntsId: '0206', serviceKeyEnv: 'CONSUMER24_COSMETIC_KEY' },
  { id: 'consumer-recall-medical-device', title: '공정위 · 의료기기 리콜 정보', cntntsId: '0207', serviceKeyEnv: 'CONSUMER24_MEDICAL_DEVICE_KEY' },
  { id: 'consumer-recall-automobile', title: '공정위 · 자동차 리콜 정보', cntntsId: '0301', serviceKeyEnv: 'CONSUMER24_AUTOMOBILE_KEY' },
  { id: 'consumer-recall-water', title: '공정위 · 먹는 물 리콜 정보', cntntsId: '0403', serviceKeyEnv: 'CONSUMER24_WATER_KEY' },
  { id: 'consumer-recall-overseas', title: '공정위 · 해외 리콜 정보', cntntsId: '0501', serviceKeyEnv: 'CONSUMER24_OVERSEAS_KEY' },
];

export const consumerRecalls: ApiConfig[] = RECALL_SPECS.map((spec) => ({
  ...SHARED,
  id: spec.id,
  title: spec.title,
  serviceKeyEnv: spec.serviceKeyEnv,
  defaultParams: { cntntsId: spec.cntntsId },
  note: `소비자24는 카테고리별 서비스키를 별도 발급합니다. ${spec.serviceKeyEnv} 환경변수에 해당 카테고리 전용 키를 넣어주세요.`,
}));
