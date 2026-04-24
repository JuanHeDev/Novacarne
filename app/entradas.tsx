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

export default function Entradas() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isDark, setIsDark] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [nuevoLoteActivo, setNuevoLoteActivo] = useState(false);
  const greeting = getGreeting();

  const isMobile = width < 768;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 450 : isMobile ? width * 0.9 : 400;
  const cardPadding = isWeb ? 32 : 24;

  const containerBg = isDark ? '#1a1a2e' : '#1a365d';
  const cardBg = isDark ? '#2a2a4e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
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
      </View>

      <View style={[styles.mainCard, { backgroundColor: cardBg, width: cardWidth, padding: cardPadding }]}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/NOVACARNE.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
        </View>

        <View style={styles.contentColumn}>
          <TouchableOpacity 
            style={[styles.mainButton, !nuevoLoteActivo && styles.mainButtonDisabled]}
            onPress={() => setNuevoLoteActivo(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
            <Text style={[styles.mainButtonText, !nuevoLoteActivo && styles.mainButtonTextDisabled]}>Nuevo lote</Text>
          </TouchableOpacity>

          <View style={styles.stepsContainer}>
            <TouchableOpacity 
              style={[styles.subButton, !nuevoLoteActivo && styles.subButtonDisabled]}
              disabled={!nuevoLoteActivo}
            >
              <MaterialCommunityIcons name="pig" size={24} color={nuevoLoteActivo ? textColor : '#ccc'} />
              <Text style={[styles.subButtonText, { color: nuevoLoteActivo ? textColor : '#ccc' }]}>
                1. Canal (cerdo)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.subButton, !nuevoLoteActivo && styles.subButtonDisabled]}
              disabled={!nuevoLoteActivo}
            >
              <MaterialCommunityIcons name="knife" size={24} color={nuevoLoteActivo ? textColor : '#ccc'} />
              <Text style={[styles.subButtonText, { color: nuevoLoteActivo ? textColor : '#ccc' }]}>
                2. Despiece
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.consultButton}>
            <MaterialCommunityIcons name="clipboard-list" size={28} color="#ffffff" />
            <Text style={styles.consultButtonText}>Consultar lotes</Text>
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    borderColor: '#1a365d',
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
    backgroundColor: '#1a365d',
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
  mainButtonDisabled: {
    backgroundColor: '#ccc',
  },
  mainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainButtonTextDisabled: {
    color: '#666',
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
  subButtonsSection: {
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a365d',
  },
subButtonDisabled: {
    borderColor: '#ddd',
    opacity: 0.6,
  },
  consultButton: {
    backgroundColor: '#1a365d',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  consultButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});