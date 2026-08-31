import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { SqlDb } from '../db/adapter';
import { getThemeMode, setThemeMode } from '../repos/settingsRepo';
import { darkTheme, lightTheme, type ColorScheme, type Theme, type ThemeMode } from './tokens';

interface ThemeContextValue {
  theme: Theme;
  /** 사용자가 고른 모드 ('system'이면 OS 설정 추종) */
  mode: ThemeMode;
  /** 실제 적용 중인 스킴 */
  resolvedScheme: ColorScheme;
  /** 모드 변경 + settings(theme_mode)에 영속화 */
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  db: SqlDb;
  children: React.ReactNode;
}

export function ThemeProvider({ db, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => getThemeMode(db));

  const setMode = useCallback(
    (next: ThemeMode) => {
      setThemeMode(db, next);
      setModeState(next);
    },
    [db],
  );

  // useColorScheme은 null/'unspecified'를 반환할 수 있다 → 라이트로 폴백
  const resolvedScheme: ColorScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedScheme === 'dark' ? darkTheme : lightTheme,
      mode,
      resolvedScheme,
      setMode,
    }),
    [mode, resolvedScheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
