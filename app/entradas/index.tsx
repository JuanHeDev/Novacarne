import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Header from '../../components/Header';
import { useCanal } from '../../contexts/CanalContext';
import { useDespiece } from '../../contexts/DespieceContext';
import { useEntradas } from '../../contexts/EntradasContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Entradas() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { resetRegistros: resetDespieceRegistros } = useDespiece();
  const { resetRegistros: resetCanalRegistros } = useCanal();
  const {
    nuevoLoteActivo, canalCompletado, despieceHabilitado, despieceCompletado, despieceConDatos,
    setNuevoLoteActivo, setCanalCompletado, setDespieceHabilitado, setDespieceCompletado, setDespieceConDatos,
    finalizarLote, reiniciar,
  } = useEntradas();

  useEffect(() => {
    if (params.canal === 'true') {
      setCanalCompletado(true);
      setDespieceHabilitado(true);
      setNuevoLoteActivo(false);
    }
    if (params.despieceDatos === 'true') {
      setDespieceConDatos(true);
    } else if (params.despieceDatos === 'false') {
      setDespieceConDatos(false);
    }
    if (params.despiece === 'true') {
      setDespieceCompletado(true);
      setDespieceConDatos(false);
    }
  }, [params]);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 500 : isTablet ? 450 : width * 0.9;
  const cardPadding = isWeb ? 32 : isTablet ? 28 : 24;
  const titleSize = isWeb ? 28 : isTablet ? 24 : 20;
  const bodySize = isWeb ? 16 : isTablet ? 15 : 14;

  const handleNuevoLote = () => {
    setNuevoLoteActivo(true);
  };

  const handleCanal = () => {
    router.push('/entradas/peso-canal');
  };

  const handleFinalizarLote = () => {
    finalizarLote();
    resetDespieceRegistros();
    resetCanalRegistros();
  };

  const handleReiniciar = () => {
    reiniciar();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Header showBack />

      <View style={styles.centerWrapper}>
      <View style={[styles.mainCard, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
        <Image
            source={require('../../assets/images/cuchillo.png')}
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
              style={[styles.subButton, { borderColor: despieceHabilitado ? colors.accent : '#aaa' }]}
              disabled={!despieceHabilitado}
              onPress={() => router.push('/entradas/despiece')}
            >
              <MaterialCommunityIcons name="knife" size={24} color={despieceHabilitado ? colors.text : '#aaa'} />
              <Text style={[styles.subButtonText, { color: despieceHabilitado ? colors.text : '#aaa' }]}>
                2. Despiece
              </Text>
              {despieceConDatos && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          </View>

          {canalCompletado && despieceCompletado && (
            <TouchableOpacity 
              style={[styles.finalizarButton, { backgroundColor: colors.accent }]}
              onPress={handleFinalizarLote}
            >
              <MaterialCommunityIcons name="check" size={20} color={isDark ? colors.background : colors.card} />
              <Text style={[styles.finalizarButtonText, { color: isDark ? colors.background : colors.card }]}>Finalizar lote</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 16,
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