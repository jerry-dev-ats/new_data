import type { ApiConfig } from '../types';

export const haccpApis: ApiConfig[] = [
  {
    id: 'haccp-product-images',
    title: 'HACCP 제품이미지 및 포장지표기정보',
    category: '식품 · HACCP',
    endpoint:
      'https://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3',
    serviceKeyParam: 'serviceKey',
    defaultParams: {
      returnType: 'json',
    },
    dataPath: ['body', 'items'],
    totalPath: ['body', 'totalCount'],
    errorCheck: {
      containerPaths: [['header']],
      codeKey: 'resultCode',
      messageKey: 'resultMessage',
      successValues: ['OK', '00'],
    },
    labelMap: {
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
    },
    note:
      '공공데이터포털에서 이 API 활용승인을 받은 뒤 공용 API_SERVICE_KEY_PUBLIC(.호환: API_SERVICE_KEY)를 .env.local에 넣어 사용하세요.',
  },
];
