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

// Lazy initialize context to avoid createContext being called at module load time
let ThemeProviderContext: React.Context<ThemeProviderState>;
export const getThemeProviderContext = () => {
  if (!ThemeProviderContext) {
    ThemeProviderContext = createContext<ThemeProviderState>(initialThemeState);
  }
  return ThemeProviderContext;
};


