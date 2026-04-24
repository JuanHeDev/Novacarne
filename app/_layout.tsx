import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function RootLayoutContent() {
  const { colors } = useTheme();
  
  return (
    <>
      <StatusBar style={colors.background === '#efe3ca' ? 'dark' : 'light'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}