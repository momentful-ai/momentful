import { useContext } from 'react';
import { getThemeProviderContext } from '../contexts/theme-context';

export const useTheme = () => {
  const ThemeProviderContext = getThemeProviderContext();
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};


