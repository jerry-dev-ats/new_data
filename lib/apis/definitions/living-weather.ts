import type { ApiConfig } from '../types';

const LIVING_WEATHER_SHARED = {
  defaultParams: {
    dataType: 'JSON',
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
    '공공데이터포털에서 기상청 생활기상지수 조회서비스(4.0) 활용승인을 받은 뒤 공용 API_SERVICE_KEY_PUBLIC(.호환: API_SERVICE_KEY)를 .env.local에 넣어 사용하세요. 필수 파라미터는 행정구역코드(areaNo, 예: 1100000000)와 발표시각(time, YYYYMMDD06 또는 YYYYMMDD18)입니다.',
} satisfies Pick<
  ApiConfig,
  'defaultParams' | 'dataPath' | 'totalPath' | 'errorCheck' | 'note'
>;

const HEALTH_WEATHER_SHARED = {
  ...LIVING_WEATHER_SHARED,
  note:
    '공공데이터포털에서 기상청 보건기상지수 조회서비스(3.0) 활용승인을 받은 뒤 공용 API_SERVICE_KEY_PUBLIC(.호환: API_SERVICE_KEY)를 .env.local에 넣어 사용하세요. 꽃가루농도위험지수는 4~6월(소나무·참나무)과 8~10월(잡초류)에 제공되며 매일 06/18시에 발표됩니다. 필수 파라미터는 행정구역코드(areaNo, 예: 1100000000)와 발표시각(time, YYYYMMDD06 또는 YYYYMMDD18)입니다.',
} satisfies Pick<
  ApiConfig,
  'defaultParams' | 'dataPath' | 'totalPath' | 'errorCheck' | 'note'
>;

const HOURLY_UV_LABELS: Record<string, string> = Object.fromEntries(
  Array.from({ length: 26 }, (_, i) => {
    const hours = i * 3;
    return [`h${hours}`, `${hours}시간 후`];
  }),
);

const POLLEN_DAILY_LABELS: Record<string, string> = {
  code: '지역코드',
  areaNo: '행정구역코드',
  date: '발표시각',
  today: '오늘',
  tomorrow: '내일',
  theDayAfter: '모레',
  theDayAfterTomorrow: '모레',
  the3Day: '글피',
};

const KMA_AREA_OPTIONS = [
  { label: '서울', value: '1100000000' },
  { label: '부산', value: '2600000000' },
  { label: '대구', value: '2700000000' },
  { label: '인천', value: '2800000000' },
  { label: '광주', value: '2900000000' },
  { label: '대전', value: '3000000000' },
  { label: '울산', value: '3100000000' },
  { label: '세종', value: '3611000000' },
  { label: '경기', value: '4100000000' },
  { label: '강원특별자치도', value: '5100000000' },
  { label: '충청북도', value: '4300000000' },
  { label: '충청남도', value: '4400000000' },
  { label: '전북특별자치도', value: '5200000000' },
  { label: '전라남도', value: '4600000000' },
  { label: '경상북도', value: '4700000000' },
  { label: '경상남도', value: '4800000000' },
  { label: '제주특별자치도', value: '5000000000' },
] satisfies NonNullable<ApiConfig['queryParams']>[number]['options'];

const KMA_REQUIRED_QUERY_PARAMS: ApiConfig['queryParams'] = [
  {
    key: 'areaNo',
    label: '행정구역코드',
    input: 'select',
    defaultValue: '1100000000',
    required: true,
    helpText: '시도 단위 행정구역코드를 선택합니다.',
    options: KMA_AREA_OPTIONS,
  },
  {
    key: 'time',
    label: '발표시각',
    placeholder: '예: 2026042406',
    inputMode: 'numeric',
    defaultValueStrategy: 'latestKmaPublishTime',
    required: true,
    maxLength: 10,
    validationPattern: '^\\d{8}(06|18)$',
    validationMessage: '발표시각은 YYYYMMDD06 또는 YYYYMMDD18 형식으로 입력하세요.',
    helpText: '기상청 발표시각은 YYYYMMDD06 또는 YYYYMMDD18 형식입니다.',
  },
];

export const livingWeatherApis: ApiConfig[] = [
  {
    ...LIVING_WEATHER_SHARED,
    id: 'kma-living-uv-index',
    title: '자외선지수 조회 (생활기상지수 V4)',
    category: '기상 · 생활기상지수',
    endpoint:
      'https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4',
    queryParams: KMA_REQUIRED_QUERY_PARAMS,
    labelMap: {
      code: '지역코드',
      areaNo: '행정구역코드',
      date: '발표시각',
      ...HOURLY_UV_LABELS,
    },
  },
  {
    ...HEALTH_WEATHER_SHARED,
    id: 'kma-health-pine-pollen-risk',
    title: '소나무 꽃가루농도위험지수 (보건기상지수 V3)',
    category: '기상 · 보건기상지수',
    endpoint:
      'https://apis.data.go.kr/1360000/HealthWthrIdxServiceV3/getPinePollenRiskIdxV3',
    queryParams: KMA_REQUIRED_QUERY_PARAMS,
    labelMap: POLLEN_DAILY_LABELS,
  },
  {
    ...HEALTH_WEATHER_SHARED,
    id: 'kma-health-oak-pollen-risk',
    title: '참나무 꽃가루농도위험지수 (보건기상지수 V3)',
    category: '기상 · 보건기상지수',
    endpoint:
      'https://apis.data.go.kr/1360000/HealthWthrIdxServiceV3/getOakPollenRiskIdxV3',
    queryParams: KMA_REQUIRED_QUERY_PARAMS,
    labelMap: POLLEN_DAILY_LABELS,
  },
  {
    ...HEALTH_WEATHER_SHARED,
    id: 'kma-health-weeds-pollen-risk',
    title: '잡초류 꽃가루농도위험지수 (보건기상지수 V3)',
    category: '기상 · 보건기상지수',
    endpoint:
      'https://apis.data.go.kr/1360000/HealthWthrIdxServiceV3/getWeedsPollenRiskndxV3',
    queryParams: KMA_REQUIRED_QUERY_PARAMS,
    labelMap: POLLEN_DAILY_LABELS,
  },
];
