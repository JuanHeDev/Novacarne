import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Index() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [isDark, setIsDark] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const greeting = getGreeting();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 500 : isTablet ? 420 : width * 0.85;
  const cardPadding = isWeb ? 40 : isTablet ? 32 : 24;
  const logoSize = isWeb ? 120 : isTablet ? 100 : 90;
  const iconSize = isWeb ? 36 : isTablet ? 32 : 28;
  const fontSize = isWeb ? 28 : isTablet ? 24 : 20;
  const buttonIconSize = isWeb ? 36 : isTablet ? 32 : 28;

  const containerBg = isDark ? '#1a1a2e' : '#1a365d';
  const cardBg = isDark ? '#2a2a4e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const logoCircleBg = isDark ? '#4a4a8e' : '#1a365d';

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'light-content'} />
      
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setIsDark(!isDark)}
        >
          <MaterialCommunityIcons
            name={isDark ? 'weather-night' : 'white-balance-sunny'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <MaterialCommunityIcons name="account" size={24} color="#ffffff" />
        </TouchableOpacity>

        {showMenu && (
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#ffffff" />
              <Text style={styles.menuItemText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, width: cardWidth, padding: cardPadding }]}>
        <Image
          source={require('../assets/images/NOVACARNE.png')}
          style={[styles.logoImage, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.22 }]}
          contentFit="contain"
        />

        <Text style={[styles.greeting, { color: textColor, fontSize }]}>{greeting}</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/entradas')}
          >
            <MaterialCommunityIcons name="arrow-up-box" size={buttonIconSize} color={textColor} />
            <Text style={[styles.buttonLabel, { color: textColor, fontSize: isWeb ? 14 : 12 }]}>Entradas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons name="cash-register" size={buttonIconSize} color={textColor} />
            <Text style={[styles.buttonLabel, { color: textColor, fontSize: isWeb ? 14 : 12 }]}>Caja</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <MaterialCommunityIcons name="chart-bar" size={buttonIconSize} color={textColor} />
            <Text style={[styles.buttonLabel, { color: textColor, fontSize: isWeb ? 14 : 12 }]}>Análisis</Text>
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
    zIndex: 10,
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 500,
  },
  logoImage: {
    borderWidth: 3,
    borderColor: '#1a365d',
  },
  greeting: {
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    alignItems: 'center',
    padding: 12,
  },
  buttonLabel: {
    color: '#333333',
    fontWeight: '500',
  },
});