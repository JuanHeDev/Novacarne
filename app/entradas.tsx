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

export default function Entradas() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, setIsDark, toggleTheme, colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [nuevoLoteActivo, setNuevoLoteActivo] = useState(false);
  const greeting = getGreeting();

  const isMobile = width < 768;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 450 : isMobile ? width * 0.9 : 400;
  const cardPadding = isWeb ? 32 : 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.accent }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
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
      </View>

      <View style={[styles.mainCard, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { borderColor: colors.accent }]}>
            <Image
              source={require('../assets/images/NOVACARNE.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{greeting}</Text>
        </View>

        <View style={styles.contentColumn}>
          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: colors.accent }]}
            onPress={() => setNuevoLoteActivo(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color={isDark ? colors.background : colors.card} />
            <Text style={[styles.mainButtonText, { color: isDark ? colors.background : colors.card }]}>Nuevo lote</Text>
          </TouchableOpacity>

          <View style={styles.stepsContainer}>
            <TouchableOpacity 
              style={[styles.subButton, { borderColor: colors.accent }]}
              disabled={!nuevoLoteActivo}
            >
              <MaterialCommunityIcons name="pig" size={24} color={nuevoLoteActivo ? colors.text : '#aaa'} />
              <Text style={[styles.subButtonText, { color: nuevoLoteActivo ? colors.text : '#aaa' }]}>
                1. Canal (cerdo)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.subButton, { borderColor: colors.accent }]}
              disabled={!nuevoLoteActivo}
            >
              <MaterialCommunityIcons name="knife" size={24} color={nuevoLoteActivo ? colors.text : '#aaa'} />
              <Text style={[styles.subButtonText, { color: nuevoLoteActivo ? colors.text : '#aaa' }]}>
                2. Despiece
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.consultButton, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="clipboard-list" size={28} color={isDark ? colors.background : colors.card} />
            <Text style={[styles.consultButtonText, { color: isDark ? colors.background : colors.card }]}>Consultar lotes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  mainCard: {
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 3,
    marginBottom: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentColumn: {
    width: '100%',
    alignItems: 'center',
  },
  mainButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepsContainer: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#888888',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  subButtonText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  consultButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  consultButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});