/** 받침 유무에 따라 이/가 조사를 붙인다: 넷플릭스가, 멜론이 */
export function withSubjectParticle(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const hasFinal = (last - 0xac00) % 28 > 0;
    return `${word}${hasFinal ? '이' : '가'}`;
  }
  return `${word}가`;
}
