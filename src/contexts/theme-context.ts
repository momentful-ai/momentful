import { createContext } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const initialThemeState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialThemeState);


