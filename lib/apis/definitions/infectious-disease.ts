import type { ApiConfig } from '../types';

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, index) => {
  const year = String(2020 + index);
  return { label: year, value: year };
});

export const infectiousDiseaseApis: ApiConfig[] = [
  {
    id: 'eid-period-basic',
    title: '감염병 기간별 통계',
    category: '보건 · 감염병',
    endpoint: 'https://apis.data.go.kr/1790387/EIDAPIService/PeriodBasic',
    responseType: 'xml',
    arrayTags: ['item'],
    defaultParams: {
      resType: 1,
    },
    dataPath: ['response', 'body', 'items', 'item'],
    totalPath: ['response', 'body', 'totalCount'],
    errorCheck: {
      containerPaths: [['response', 'header']],
      codeKey: 'resultCode',
      messageKey: 'resultMsg',
      successValues: ['0', '00', 'OK', 'NORMAL_SERVICE'],
    },
    queryParams: [
      {
        key: 'searchPeriodType',
        label: '집계 기준',
        input: 'select',
        defaultValue: '2',
        required: true,
        helpText: '연도별 또는 월별 집계를 선택합니다.',
        options: [
          { label: '연도별', value: '1' },
          { label: '월별', value: '2' },
        ],
      },
      {
        key: 'searchStartYear',
        label: '시작 연도',
        input: 'select',
        defaultValue: '2023',
        required: true,
        options: YEAR_OPTIONS,
      },
      {
        key: 'searchEndYear',
        label: '종료 연도',
        input: 'select',
        defaultValue: '2024',
        required: true,
        options: YEAR_OPTIONS,
      },
    ],
    labelMap: {
      period: '기간',
      icdGroupNm: '감염병 등급',
      icdNm: '감염병명',
      resultVal: '발생 건수',
    },
    note:
      '공공데이터포털에서 감염병포털 OpenAPI 활용승인을 받은 뒤 공용 API_SERVICE_KEY_PUBLIC(.호환: API_SERVICE_KEY)를 .env.local에 넣어 사용하세요. 현재 응답은 XML(resType=1) 기준으로 파싱합니다.',
  },
];
