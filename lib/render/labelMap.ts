export const COMMON_LABEL_MAP: Record<string, string> = {
  // 공통
  SEQ: '일련번호',
  NO: '번호',

  // 품목/제품
  ITEM_NAME: '품목명',
  ITEM_SEQ: '품목일련번호',
  ITEM_CODE: '품목코드',
  PRDUCT_NM: '제품명',
  PRDLST_NM: '제품명',
  PRODUCT_NAME: '제품명',
  BAR_CODE: '바코드',

  // 업체
  ENTP_NAME: '업체명',
  ENTP_NO: '업체번호',
  BSSH_NM: '업체명',
  BIZRNO: '사업자번호',

  // 날짜
  PERMIT_DATE: '허가일',
  REPORT_DATE: '보고일',
  RECALL_START_DATE: '회수시작일',
  APPROVE_DATE: '승인일',
  CHANGE_DATE: '변경일',
  CRTE_DT: '작성일',
  REGIST_DT: '등록일',

  // 기능성
  EFFECT: '효능·효과',
  EFFECT_KIND: '효능종류',
  USAGE: '사용법',

  // 회수 정보
  RECALL_REASON: '회수사유',
  RECALL_PLAN: '회수계획',
  RECALL_GRADE: '회수등급',
  RECALL_TYPE: '회수유형',

  // 행정처분
  DISPOS_NO: '처분번호',
  DISPOS_TYPE: '처분유형',
  DISPOS_RESN: '처분사유',
  DISPOS_DT: '처분일자',

  // DUR
  INGR_NAME: '성분명',
  INGR_CODE: '성분코드',
  TYPE_NAME: '구분',
  MIX_TYPE: '병용금기',
  PROHBT_CONTENT: '금기내용',

  // 소비자24(공정위) 공통 리콜 필드
  infoId: '정보ID',
  cntntsId: '컨텐츠ID',
  infoSj: '제목',
  infoDcSumry: '요약',
  infoDetailCn: '상세내용',
  infoOrigin: '출처기관',
  infoUrl: '원문링크',

  // 공통 기타
  FORM: '제형',
  CLASS_NAME: '분류명',
  ETC_OTC_CODE: '전문/일반구분',
  PACK_UNIT: '포장단위',
  VALID_TERM: '유효기간',
  STORAGE_METHOD: '저장방법',
  IMAGE: '이미지',
  IMAGE_URL: '이미지',
  DETAIL_URL: '상세링크',
};

/**
 * 영문 키를 보기 편한 라벨로 변환한다.
 * 1) 주어진 apiLabelMap 우선
 * 2) COMMON_LABEL_MAP
 * 3) SNAKE_CASE / camelCase 를 자동으로 공백 분리
 */
export function toLabel(
  key: string,
  apiLabelMap?: Record<string, string>,
): string {
  if (apiLabelMap?.[key]) return apiLabelMap[key];
  if (COMMON_LABEL_MAP[key]) return COMMON_LABEL_MAP[key];
  const upper = key.toUpperCase();
  if (apiLabelMap?.[upper]) return apiLabelMap[upper];
  if (COMMON_LABEL_MAP[upper]) return COMMON_LABEL_MAP[upper];

  // camelCase → "camel Case"
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .trim();
  // 첫 글자 대문자
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
