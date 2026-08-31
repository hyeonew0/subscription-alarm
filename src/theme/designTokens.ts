import {
  darkCard,
  darkColors,
  lightCard,
  lightColors,
  radius,
  spacing,
  typography,
  type ColorTokens,
  type ElevationToken,
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
  const walk = (obj: Record<string, unknown>): DesignTokenGroup => {
    const group: DesignTokenGroup = {};
    for (const [name, value] of Object.entries(obj)) {
      group[name] =
        typeof value === 'string'
          ? { $type: 'color', $value: value }
          : walk(value as Record<string, unknown>);
    }
    return group;
  };
  return walk(colors as unknown as Record<string, unknown>);
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

  const shadowValue = (s: ElevationToken) =>
    s.ios.shadowOpacity === 0
      ? null
      : {
          color: `rgba(0,0,0,${s.ios.shadowOpacity})`,
          offsetX: s.ios.shadowOffset.width,
          offsetY: s.ios.shadowOffset.height,
          blur: s.ios.shadowRadius,
          spread: 0,
        };

  return {
    color: {
      light: colorGroup(lightColors),
      dark: colorGroup(darkColors),
    },
    spacing: numberGroup(spacing),
    radius: numberGroup(radius),
    typography: typographyGroup,
    card: {
      ...numberGroup({
        radius: lightCard.radius,
        padding: lightCard.padding,
        paddingTight: lightCard.paddingTight,
        gap: lightCard.gap,
      }),
      shadow: {
        light: { $type: 'shadow', $value: shadowValue(lightCard.shadow) },
        dark: { $type: 'shadow', $value: shadowValue(darkCard.shadow) },
      },
    },
  };
}
