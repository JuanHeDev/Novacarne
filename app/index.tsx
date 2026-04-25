import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, setIsDark, toggleTheme, colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const greeting = getGreeting();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 700 : isTablet ? 450 : width * 0.85;
  const cardPadding = isWeb ? 48 : isTablet ? 32 : 24;
  const logoSize = isWeb ? 160 : isTablet ? 100 : 90;
  const fontSize = isWeb ? 32 : isTablet ? 24 : 20;
  const buttonIconSize = isWeb ? 40 : isTablet ? 32 : 28;
  const buttonSize = isWeb ? 70 : isTablet ? 60 : 50;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.accent }]}
          onPress={toggleTheme}
        >
          <MaterialCommunityIcons
            name={isDark ? 'weather-night' : 'white-balance-sunny'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.accent }]}
          onPress={() => setShowMenu(!showMenu)}
        >
          <MaterialCommunityIcons name="account" size={24} color="#fff" />
        </TouchableOpacity>

        {showMenu && (
          <View style={[styles.menu, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <MaterialCommunityIcons name="logout" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: isWeb ? 14 : 12 }]}>Entradas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons name="cash-register" size={buttonIconSize} color={colors.text} />
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: isWeb ? 14 : 12 }]}>Caja</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons name="chart-bar" size={buttonIconSize} color={colors.text} />
            <Text style={[styles.buttonLabel, { color: colors.text, fontSize: isWeb ? 14 : 12 }]}>Análisis</Text>
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
  headerButtons: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 0,
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 500,
    padding: 24,
  },
logoImage: {
    borderWidth: 3,
    borderColor: '#170c79',
  },
  greeting: {
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonLabel: {
    fontWeight: '500',
    fontSize: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 16,
  },
  button: {
    alignItems: 'center',
    padding: 12,
    minWidth: 60,
  },
  buttonLabel: {
    fontWeight: '500',
  },
});