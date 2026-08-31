import {
  darkColors,
  lightColors,
  radius,
  spacing,
  typography,
  type ColorTokens,
} from './tokens';

/**
 * W3C Design Tokens(DTCG) 형식 빌더.
 * design-tokens.json은 이 함수의 출력을 그대로 저장한 파일이며
 * (테스트가 동기화를 강제한다: UPDATE_TOKENS=1 npm test 로 재생성),
 * Figma Variables 가져오기 플러그인에서 color/light·color/dark를
 * 컬렉션의 두 모드로 매핑해 그대로 import할 수 있다.
 * 이름/구조는 tokens.ts와 동일하다.
 */

type DesignTokenLeaf = { $type: string; $value: unknown };
interface DesignTokenGroup {
  [key: string]: DesignTokenLeaf | DesignTokenGroup;
}

function colorGroup(colors: ColorTokens): DesignTokenGroup {
  const group: DesignTokenGroup = {};
  for (const [ns, values] of Object.entries(colors)) {
    const sub: DesignTokenGroup = {};
    for (const [name, value] of Object.entries(values as Record<string, string>)) {
      sub[name] = { $type: 'color', $value: value };
    }
    group[ns] = sub;
  }
  return group;
}

function numberGroup(values: Record<string, number>): DesignTokenGroup {
  const group: DesignTokenGroup = {};
  for (const [name, value] of Object.entries(values)) {
    group[name] = { $type: 'number', $value: value };
  }
  return group;
}

export function buildDesignTokens(): DesignTokenGroup {
  const typographyGroup: DesignTokenGroup = {};
  for (const [name, t] of Object.entries(typography)) {
    typographyGroup[name] = {
      $type: 'typography',
      $value: {
        fontSize: t.fontSize,
        lineHeight: t.lineHeight,
        fontWeight: Number(t.fontWeight),
      },
    };
  }

  return {
    color: {
      light: colorGroup(lightColors),
      dark: colorGroup(darkColors),
    },
    spacing: numberGroup(spacing),
    radius: numberGroup(radius),
    typography: typographyGroup,
  };
}
