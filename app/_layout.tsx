import { Image } from 'expo-image';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CanalProvider } from '../contexts/CanalContext';
import { DespieceProvider } from '../contexts/DespieceContext';
import { EntradasProvider } from '../contexts/EntradasContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { invalidatePerfil } from '../lib/perfil';
import { supabase } from '../lib/supabase';

const TIEMPO_SPLASH = 1000;

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
      invalidatePerfil();
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}

function RootLayoutContent() {
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const splashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarSplash = () => {
    setShowSplash(true);
    if (splashTimeout.current) clearTimeout(splashTimeout.current);
    splashTimeout.current = setTimeout(() => setShowSplash(false), TIEMPO_SPLASH);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(true);
      setUserId(session?.user?.id ?? null);
      if (session) mostrarSplash();
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
      if (event === 'SIGNED_IN') mostrarSplash();
    });
    return () => {
      subscription.unsubscribe();
      if (splashTimeout.current) clearTimeout(splashTimeout.current);
    };
  }, []);

  return (
    <>
      <StatusBar style={colors.background === '#efe3ca' ? 'dark' : 'light'} />
      <EntradasProvider>
        <CanalProvider>
          <DespieceProvider>
            <Slot key={userId ?? 'anon'} />
          </DespieceProvider>
        </CanalProvider>
      </EntradasProvider>
      {!ready && (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
      {showSplash && (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <Image
            source={require('../assets/images/logo/NOVACARNE.png')}
            style={[styles.splashLogo, { borderColor: colors.accent }]}
            contentFit="contain"
          />
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.splashText, { color: colors.text }]}>Cargando opciones...</Text>
        </View>
      )}
      <AuthGuard />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  splashLogo: {
    width: 130,
    height: 130,
    borderRadius: 28,
    borderWidth: 3,
    marginBottom: 20,
  },
  splashText: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
