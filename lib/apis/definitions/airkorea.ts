import type { ApiConfig } from '../types';

const AIRKOREA_SHARED = {
  defaultParams: {
    returnType: 'json',
  },
  dataPath: ['body', 'items'],
  totalPath: ['body', 'totalCount'],
  errorCheck: {
    containerPaths: [['header']],
    codeKey: 'resultCode',
    messageKey: 'resultMsg',
    successValues: ['00', 'OK', 'NORMAL_SERVICE'],
  },
  note:
    '공공데이터포털에서 한국환경공단 에어코리아 대기오염정보 조회서비스 활용승인을 받은 뒤 공용 API_SERVICE_KEY_PUBLIC(.호환: API_SERVICE_KEY)를 .env.local에 넣어 사용하세요. 측정소명(stationName)은 필수입니다.',
} satisfies Pick<
  ApiConfig,
  'defaultParams' | 'dataPath' | 'totalPath' | 'errorCheck' | 'note'
>;

export const airKoreaApis: ApiConfig[] = [
  {
    ...AIRKOREA_SHARED,
    id: 'airkorea-station-realtime',
    title: '측정소별 실시간 측정정보',
    category: '대기 · AirKorea',
    endpoint:
      'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty',
    queryParams: [
      {
        key: 'stationName',
        label: '측정소명',
        placeholder: '예: 종로구',
        defaultValue: '종로구',
        required: true,
        helpText: 'AirKorea 측정소명 기준으로 조회합니다.',
      },
      {
        key: 'dataTerm',
        label: '조회 기간',
        input: 'select',
        defaultValue: 'DAILY',
        options: [
          { label: '일간 (DAILY)', value: 'DAILY' },
          { label: '월간 (MONTH)', value: 'MONTH' },
          { label: '3개월 (3MONTH)', value: '3MONTH' },
        ],
      },
      {
        key: 'ver',
        label: '버전',
        input: 'select',
        defaultValue: '1.0',
        options: [{ label: '1.0', value: '1.0' }],
      },
    ],
    labelMap: {
      stationName: '측정소명',
      dataTime: '측정시각',
      mangName: '망 구분',
      khaiValue: '통합대기환경지수',
      khaiGrade: '통합대기환경지수 등급',
      so2Value: '아황산가스 농도',
      so2Grade: '아황산가스 등급',
      so2Flag: '아황산가스 측정상태',
      coValue: '일산화탄소 농도',
      coGrade: '일산화탄소 등급',
      coFlag: '일산화탄소 측정상태',
      o3Value: '오존 농도',
      o3Grade: '오존 등급',
      o3Flag: '오존 측정상태',
      no2Value: '이산화질소 농도',
      no2Grade: '이산화질소 등급',
      no2Flag: '이산화질소 측정상태',
      pm10Value: 'PM10 농도',
      pm10Value24: 'PM10 24시간 예측이동농도',
      pm10Grade: 'PM10 등급',
      pm10Grade1h: 'PM10 1시간 등급',
      pm10Flag: 'PM10 측정상태',
      pm25Value: 'PM2.5 농도',
      pm25Value24: 'PM2.5 24시간 예측이동농도',
      pm25Grade: 'PM2.5 등급',
      pm25Grade1h: 'PM2.5 1시간 등급',
      pm25Flag: 'PM2.5 측정상태',
    },
  },
];
