import type { ApiConfig } from '../types';

const FOODSAFETY_SHARED = {
  endpoint: 'http://openapi.foodsafetykorea.go.kr/api',
  requestStyle: 'foodsafetykorea',
  responseType: 'json',
  serviceKeyEnv: 'API_SERVICE_KEY_FOOD',
  dataPath: ['row'],
  totalPath: ['total_count'],
  errorCheck: {
    containerPaths: [['RESULT']],
    codeKey: 'CODE',
    messageKey: 'MSG',
    successValues: ['INFO-000'],
  },
  note:
    '식품안전나라 OpenAPI 인증키를 API_SERVICE_KEY_FOOD로 설정해야 합니다. data.go.kr 키와 별개입니다.',
} satisfies Pick<
  ApiConfig,
  | 'endpoint'
  | 'requestStyle'
  | 'responseType'
  | 'serviceKeyEnv'
  | 'dataPath'
  | 'totalPath'
  | 'errorCheck'
  | 'note'
>;

export const foodsafetyKoreaApis: ApiConfig[] = [
  {
    ...FOODSAFETY_SHARED,
    id: 'foodsafety-recall-sale-stop',
    title: '회수·판매중지 정보',
    category: '식품안전나라 · 회수/판매중지',
    serviceId: 'I0490',
    dataPath: ['I0490', 'row'],
    totalPath: ['I0490', 'total_count'],
    errorCheck: {
      ...FOODSAFETY_SHARED.errorCheck,
      containerPaths: [['I0490', 'RESULT']],
    },
    labelMap: {
      PRDTNM: '제품명',
      RTRVLPRVNS: '회수사유',
      BSSHNM: '제조업체명',
      ADDR: '업체주소',
      TELNO: '전화번호',
      BRCDNO: '바코드번호',
      FRMLCUNIT: '포장단위',
      MNFDT: '제조일자',
      RTRVLPLANDOC_RTRVLMTHD: '회수방법',
      DISTBTMLMT: '유통/소비기한',
      PRDLST_TYPE: '식품분류',
      IMG_FILE_PATH: '제품사진 URL',
      PRDLST_CD: '품목코드',
      CRET_DTM: '등록일',
      RTRVLDSUSE_SEQ: '회수·판매중지 일련번호',
      PRDLST_REPORT_NO: '품목제조보고번호',
      RTRVL_GRDCD_NM: '회수등급',
      PRDLST_CD_NM: '품목유형',
      LCNS_NO: '업체인허가번호',
    },
  },
  {
    ...FOODSAFETY_SHARED,
    id: 'foodsafety-domestic-test-failures',
    title: '검사부적합(국내)',
    category: '식품안전나라 · 검사부적합',
    serviceId: 'I2620',
    dataPath: ['I2620', 'row'],
    totalPath: ['I2620', 'total_count'],
    errorCheck: {
      ...FOODSAFETY_SHARED.errorCheck,
      containerPaths: [['I2620', 'RESULT']],
    },
    labelMap: {
      PRDTNM: '제품명',
      BSSHNM: '업소명',
      ADDR: '주소',
      BRCDNO: '바코드번호',
      FRMLCUNIT: '포장단위',
      MNFDT: '제조일자',
      DISTBTMLMT: '유통/소비기한',
      TEST_ITMNM: '부적합항목',
      STDR_STND: '기준규격',
      TESTANALS_RSLT: '검사결과',
      INSTT_NM: '검사기관',
      PRDLST_CD_NM: '품목유형',
      CRET_DTM: '등록일',
      RTRVLDSUSE_SEQ: '일련번호',
      PRDLST_REPORT_NO: '품목제조보고번호',
      LCNS_NO: '업체인허가번호',
      REGSTR_TELNO: '등록자 전화번호',
      REPORTR_TELNO: '신고자 전화번호',
    },
  },
  {
    ...FOODSAFETY_SHARED,
    id: 'foodsafety-hf-functional-material-status',
    title: '건강기능식품 기능성 원료인정 현황',
    category: '식품안전나라 · 건강기능식품',
    serviceId: 'I-0040',
    dataPath: ['I-0040', 'row'],
    totalPath: ['I-0040', 'total_count'],
    errorCheck: {
      ...FOODSAFETY_SHARED.errorCheck,
      containerPaths: [['I-0040', 'RESULT']],
    },
    labelMap: {
      PRMS_DT: '인정일자',
      DAY_INTK_CN: '일일섭취량',
      IFTKN_ATNT_MATR_CN: '섭취 시 주의사항',
      HF_FNCLTY_MTRAL_RCOGN_NO: '기능성원료인정번호',
      BSSH_NM: '업체명',
      FNCLTY_CN: '기능성 내용',
      APLC_RAWMTRL_NM: '적용원료명',
      INDUTY_NM: '업종명',
      ADDR: '주소',
    },
  },
  {
    ...FOODSAFETY_SHARED,
    id: 'foodsafety-hf-individual-approved-info',
    title: '건강기능식품 개별인정형 정보',
    category: '식품안전나라 · 건강기능식품',
    serviceId: 'I-0050',
    dataPath: ['I-0050', 'row'],
    totalPath: ['I-0050', 'total_count'],
    errorCheck: {
      ...FOODSAFETY_SHARED.errorCheck,
      containerPaths: [['I-0050', 'RESULT']],
    },
    labelMap: {
      WT_UNIT: '단위',
      PRIMARY_FNCLTY: '주 기능성',
      IFTKN_ATNT_MATR_CN: '섭취 시 주의사항',
      HF_FNCLTY_MTRAL_RCOGN_NO: '기능성원료인정번호',
      DAY_INTK_LOWLIMIT: '일일섭취량 하한',
      DAY_INTK_HIGHLIMIT: '일일섭취량 상한',
      RAWMTRL_NM: '원료명',
    },
  },
];
