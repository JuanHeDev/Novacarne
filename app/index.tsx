import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import { getPerfil } from '../lib/perfil';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const greeting = getGreeting();

  useEffect(() => {
    let activo = true;
    getPerfil().then(perfil => {
      if (!activo || !perfil) return;
      setUserName(perfil.nombre_completo);
      setIsAdmin(perfil.rol === 'administrador');
    });
    return () => { activo = false; };
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 560 : isTablet ? 480 : width * 0.92;
  const cardPadding = isWeb ? 40 : isTablet ? 32 : 28;
  const logoSize = isWeb ? 150 : isTablet ? 120 : 110;
  const fontSize = isWeb ? 30 : isTablet ? 26 : 22;
  const buttonIconSize = isWeb ? 42 : isTablet ? 36 : 32;
  const buttonSize = isWeb ? 72 : isTablet ? 64 : 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
          <Image
            source={require('../assets/images/logo/NOVACARNE.png')}
            style={[styles.logoImage, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.22 }]}
            contentFit="contain"
          />

          <Text style={[styles.greeting, { color: colors.text, fontSize }]}>{greeting}{userName ? `, ${userName}` : ''}</Text>

          <View style={[styles.section, { borderColor: colors.accent, backgroundColor: colors.accent + '0D' }]}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Operativo</Text>
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.button} onPress={() => router.push('/entradas')}>
                <MaterialCommunityIcons name="arrow-up-box" size={buttonIconSize} color={colors.text} />
                <Text style={[styles.buttonLabel, { color: colors.text }]}>Entradas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} disabled>
                <MaterialCommunityIcons name="cash-register" size={buttonIconSize} color={colors.text + '44'} />
                <Text style={[styles.buttonLabel, { color: colors.text + '44' }]}>Caja</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { borderColor: colors.accent, backgroundColor: colors.accent + '0D' }]}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Administración</Text>
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.button} disabled>
                <MaterialCommunityIcons name="chart-bar" size={buttonIconSize} color={colors.text + '44'} />
                <Text style={[styles.buttonLabel, { color: colors.text + '44' }]}>Análisis</Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity style={styles.button} onPress={() => router.push('/registros')}>
                  <MaterialCommunityIcons name="clipboard-list" size={buttonIconSize} color={colors.text} />
                  <Text style={[styles.buttonLabel, { color: colors.text }]}>Registros</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.button} onPress={() => router.push('/consultas')}>
                <MaterialCommunityIcons name="magnify" size={buttonIconSize} color={colors.text} />
                <Text style={[styles.buttonLabel, { color: colors.text }]}>Consultas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  card: {
    borderRadius: 24,
    alignItems: 'center',
    maxWidth: 600,
    padding: 24,
    gap: 24,
  },
logoImage: {
    borderWidth: 3,
    borderColor: '#170c79',
  },
  greeting: {
    fontWeight: '600',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonLabel: {
    fontWeight: '500',
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 20,
  },
  button: {
    alignItems: 'center',
    padding: 12,
    minWidth: 70,
    gap: 6,
  },
});