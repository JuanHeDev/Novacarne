import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<object | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    const inAuthGroup = segments[0] === 'login';
    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, segments]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}

function RootLayoutContent() {
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  return (
    <>
      <StatusBar style={colors.background === '#efe3ca' ? 'dark' : 'light'} />
      <Slot />
      {!ready && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: colors.background,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
      <AuthGuard />
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
