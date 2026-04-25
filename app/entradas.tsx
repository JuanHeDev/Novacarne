import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Entradas() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { isDark, toggleTheme, colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [nuevoLoteActivo, setNuevoLoteActivo] = useState(false);
  const [canalCompletado, setCanalCompletado] = useState(false);
  const [despieceHabilitado, setDespieceHabilitado] = useState(false);
  const [despieceCompletado, setDespieceCompletado] = useState(false);

  useEffect(() => {
    if (params.despiece === 'true') {
      setDespieceHabilitado(true);
      setCanalCompletado(true);
      setNuevoLoteActivo(false);
    }
    if (params.despieceCompletado === 'true') {
      setDespieceHabilitado(true);
      setDespieceCompletado(true);
      setCanalCompletado(true);
      setNuevoLoteActivo(false);
    }
  }, [params]);

  const isMobile = width < 768;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 450 : isMobile ? width * 0.9 : 400;
  const cardPadding = isWeb ? 32 : 24;

  const handleNuevoLote = () => {
    setNuevoLoteActivo(true);
  };

  const handleCanal = () => {
    router.push('/peso-canal');
  };

  const handleFinalizarLote = () => {
    setCanalCompletado(true);
    setDespieceHabilitado(false);
    setDespieceCompletado(false);
  };

  const handleReiniciar = () => {
    setNuevoLoteActivo(true);
    setCanalCompletado(false);
    setDespieceHabilitado(false);
    setDespieceCompletado(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
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
        <Image
            source={require('../assets/images/cuchillo.png')}
            style={styles.iconImage}
        />
        <View style={styles.contentColumn}>
          {!nuevoLoteActivo && !canalCompletado ? (
            <TouchableOpacity 
              style={[styles.mainButton, { backgroundColor: colors.accent }]}
              onPress={handleNuevoLote}
            >
              <MaterialCommunityIcons name="plus" size={20} color={isDark ? colors.background : colors.card} />
              <Text style={[styles.mainButtonText, { color: isDark ? colors.background : colors.card }]}>Nuevo lote</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.mainButton, { backgroundColor: '#888' }]}
              disabled
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={[styles.mainButtonText, { color: '#fff' }]}>Nuevo lote</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.stepsContainer, { borderColor: colors.accent }]}>
            <TouchableOpacity 
              style={[styles.subButton, { borderColor: nuevoLoteActivo ? colors.accent : '#aaa' }]}
              disabled={!nuevoLoteActivo}
              onPress={handleCanal}
            >
              <MaterialCommunityIcons name="pig" size={24} color={nuevoLoteActivo ? colors.text : '#aaa'} />
              <Text style={[styles.subButtonText, { color: nuevoLoteActivo ? colors.text : '#aaa' }]}>
                1. Canal
              </Text>
              {canalCompletado && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.subButton, 
                { borderColor: despieceHabilitado || despieceCompletado ? colors.accent : '#aaa' },
                despieceCompletado && styles.subButtonCompletado
              ]}
              disabled={!despieceHabilitado && !despieceCompletado}
              onPress={() => router.push('/despiece')}
            >
              <MaterialCommunityIcons name="knife" size={24} color={despieceHabilitado || despieceCompletado ? colors.text : '#aaa'} />
              <Text style={[styles.subButtonText, { color: despieceHabilitado || despieceCompletado ? colors.text : '#aaa' }]}>
                2. Despiece
              </Text>
              {despieceCompletado && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          </View>

          {canalCompletado && (
            <TouchableOpacity 
              style={[styles.finalizarButton, { backgroundColor: colors.accent }]}
              onPress={handleReiniciar}
            >
              <MaterialCommunityIcons name="check" size={20} color={isDark ? colors.background : colors.card} />
              <Text style={[styles.finalizarButtonText, { color: isDark ? colors.background : colors.card }]}>Finalizar lote</Text>
            </TouchableOpacity>
          )}
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
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
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
    backgroundColor: 'transparent',
  },
  subButtonCompletado: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  subButtonText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  finalizarButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  finalizarButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  consultButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  consultButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});