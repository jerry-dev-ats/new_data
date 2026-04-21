export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type ApiConfig = {
  id: string;
  title: string;
  category: string;
  endpoint: string;
  requestStyle?: 'query' | 'foodsafetykorea';
  serviceId?: string;
  method?: 'GET' | 'POST';
  serviceKeyParam?: string;
  /**
   * API 전용 서비스키를 담는 환경변수 이름.
   * 지정되지 않거나 값이 비어 있으면 공통 `API_SERVICE_KEY_PUBLIC`
   * 또는 레거시 `API_SERVICE_KEY`로 폴백한다.
   * 소비자24처럼 카테고리별로 키가 다른 API에 유용.
   */
  serviceKeyEnv?: string;
  defaultParams?: Record<string, string | number>;
  /** 'json'(기본) 또는 'xml'. XML이면 fast-xml-parser로 파싱 */
  responseType?: 'json' | 'xml';
  /** XML 파싱 시 단건이어도 배열로 강제할 태그 이름(예: 'content', 'item') */
  arrayTags?: string[];
  /** JSON 루트가 { response: ... } 래퍼인지 여부. 기본 true (식약처 표준) */
  unwrapResponseRoot?: boolean;
  /**
   * 업스트림이 2xx로 내려주지만 본문에 에러 코드를 실어 보내는 API를 위한 감지 규칙.
   * containerPaths 중 하나에서 codeKey를 찾았을 때 값이 successValues에 없으면 에러로 처리.
   */
  errorCheck?: {
    containerPaths: string[][];
    codeKey?: string;
    messageKey?: string;
    successValues?: string[];
    /** 이 코드가 오면 에러가 아니라 "빈 결과"로 정규화 */
    emptyValues?: string[];
  };
  dataPath: string[];
  totalPath?: string[];
  pageParam?: string;
  sizeParam?: string;
  labelMap?: Record<string, string>;
  note?: string;
};

export type NormalizedPage = {
  items: JsonObject[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
};

export type ProxyErrorResponse = {
  error: true;
  message: string;
  upstreamStatus?: number;
  upstreamBody?: string;
};
