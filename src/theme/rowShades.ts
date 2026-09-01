/**
 * 구독행 칩 셰이드 배정: 같은 카테고리 등장 순서대로 1→2→3 반복.
 * (Figma 구독행 variant set 규칙 — 카드 안에서 같은 카테고리 항목을 명도로 구분)
 */
export function computeRowShades(categories: string[]): Array<1 | 2 | 3> {
  const counts = new Map<string, number>();
  return categories.map((cat) => {
    const n = counts.get(cat) ?? 0;
    counts.set(cat, n + 1);
    return ((n % 3) + 1) as 1 | 2 | 3;
  });
}

/**
 * 단일 카테고리 n개 항목에 셰이드 1→3 선형 분배 (1개→[1], 2개→[1,3], 3개→[1,2,3]).
 * 등록 그리드·목록 카테고리 카드 규칙 (02_목록 목업 확인).
 */
export function distributeShades(count: number): Array<1 | 2 | 3> {
  if (count <= 0) return [];
  if (count === 1) return [1];
  return Array.from(
    { length: count },
    (_, i) => Math.round(1 + (2 * i) / (count - 1)) as 1 | 2 | 3,
  );
}
