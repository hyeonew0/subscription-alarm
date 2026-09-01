/** 알림 오프셋(일 단위) → 표시 라벨. 0=당일, 30의 배수는 개월로 표기 */
export function offsetLabel(offset: number): string {
  if (offset === 0) return '당일';
  if (offset >= 30 && offset % 30 === 0) return `${offset / 30}개월 전`;
  return `${offset}일 전`;
}

/** 오프셋 배열 → '7일 전, 3일 전' 형태 */
export function formatOffsets(offsets: number[], separator = ', '): string {
  return offsets.map(offsetLabel).join(separator);
}
