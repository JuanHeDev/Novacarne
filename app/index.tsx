import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';

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
  const greeting = getGreeting();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 700 : isTablet ? 500 : width * 0.92;
  const cardPadding = isWeb ? 48 : isTablet ? 36 : 32;
  const logoSize = isWeb ? 180 : isTablet ? 130 : 120;
  const fontSize = isWeb ? 36 : isTablet ? 28 : 24;
  const buttonIconSize = isWeb ? 48 : isTablet ? 40 : 36;
  const buttonSize = isWeb ? 80 : isTablet ? 72 : 64;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Header />

      <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
        <Image
          source={require('../assets/images/NOVACARNE.png')}
          style={[styles.logoImage, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.22 }]}
          contentFit="contain"
        />

        <Text style={[styles.greeting, { color: colors.text, fontSize }]}>{greeting}</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/entradas')}
          >
            <MaterialCommunityIcons name="arrow-up-box" size={buttonIconSize} color={colors.text} />
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: isWeb ? 16 : 14 }]}>Entradas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons name="cash-register" size={buttonIconSize} color={colors.text} />
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: isWeb ? 16 : 14 }]}>Caja</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons name="chart-bar" size={buttonIconSize} color={colors.text} />
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: isWeb ? 16 : 14 }]}>Análisis</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  card: {
    borderRadius: 24,
    alignItems: 'center',
    maxWidth: 600,
    padding: 24,
  },
logoImage: {
    borderWidth: 3,
    borderColor: '#170c79',
  },
  greeting: {
    fontWeight: '600',
    marginBottom: 24,
  },
  buttonLabel: {
    fontWeight: '500',
    fontSize: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 24,
  },
  button: {
    alignItems: 'center',
    padding: 16,
    minWidth: 80,
  },
});