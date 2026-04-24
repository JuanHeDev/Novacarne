import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  accent: string;
  accentLight: string;
}

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#efe3ca',
  card: '#ffffff',
  text: '#170c79',
  accent: '#170c79',
  accentLight: '#56b6c6',
};

const darkColors: ThemeColors = {
  background: '#2c3947',
  card: '#3d4f66',
  text: '#e8edf2',
  accent: '#c2a56d',
  accentLight: '#547a95',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);
  
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}