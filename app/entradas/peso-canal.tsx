import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import { useCanal, type PesoRegistro } from '../../contexts/CanalContext';
import { useEntradas } from '../../contexts/EntradasContext';

type RegistrosMap = Record<number, number>;

export default function PesoCanal() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { agregarRegistros } = useCanal();
  const { cantidadCanales, personasCarga } = useEntradas();

  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [numCanal, setNumCanal] = useState(1);
  const [peso, setPeso] = useState('');
  const [pesosMap, setPesosMap] = useState<RegistrosMap>({});
  const [taraMap, setTaraMap] = useState<Record<number, number>>({});

  const isMobile = width < 768;
  const cardWidth = isMobile ? width * 0.9 : 400;

  const pesoActual = pesosMap[numCanal]?.toString() || peso;

  const indiceTara = taraMap[numCanal];
  const taraPeso = indiceTara !== undefined && personasCarga[indiceTara] ? personasCarga[indiceTara].peso : 0;
  const taraActiva = indiceTara !== undefined && personasCarga.length > 0;

  const pesoNumerico = peso && parseFloat(peso) > 0 ? parseFloat(peso) : null;
  const pesoEfectivo = pesoNumerico !== null ? Math.max(0, pesoNumerico - taraPeso) : null;

  const minCanales = cantidadCanales > 0 ? cantidadCanales : 10;

  const guardarCanalActual = () => {
    const nextPesos = { ...pesosMap };
    if (peso) {
      nextPesos[numCanal] = parseFloat(peso);
    } else {
      delete nextPesos[numCanal];
    }
    setPesosMap(nextPesos);

    const nextTara = { ...taraMap };
    if (indiceTara !== undefined) {
      nextTara[numCanal] = indiceTara;
    } else {
      delete nextTara[numCanal];
    }
    setTaraMap(nextTara);
  };

  const toggleTara = (idx: number) => {
    if (taraMap[numCanal] === idx) {
      const next = { ...taraMap };
      delete next[numCanal];
      setTaraMap(next);
    } else {
      setTaraMap({ ...taraMap, [numCanal]: idx });
    }
  };

  const handleFinalizar = () => {
    setShowFinalizarModal(true);
  };

  const confirmarFinalizar = () => {
    const pesosConActual = peso
      ? { ...pesosMap, [numCanal]: parseFloat(peso) }
      : pesosMap;

    const nuevosRegistros: PesoRegistro[] = Object.entries(pesosConActual).map(([canal, pesoBruto]) => {
      const canalNum = parseInt(canal);
      const tara = taraMap[canalNum];
      const taraPesoCanal = tara !== undefined && personasCarga[tara] ? personasCarga[tara].peso : 0;
      return {
        numCanal: canalNum,
        peso: Math.max(0, pesoBruto - taraPesoCanal),
        fecha: new Date(),
      };
    });
    agregarRegistros(nuevosRegistros);

    const numCanales = nuevosRegistros.length;
    const pesoTotal = nuevosRegistros.reduce((sum, r) => sum + r.peso, 0);
    const pesosCanales = nuevosRegistros.map(r => ({ num_canal: r.numCanal, peso: r.peso }));

    setShowFinalizarModal(false);
    router.replace({
      pathname: '/entradas/lotes-entrada',
      params: {
        numCanales: String(numCanales),
        pesoTotal: String(pesoTotal),
        pesosCanales: JSON.stringify(pesosCanales),
      },
    });
  };

  const handlePrev = () => {
    guardarCanalActual();
    if (numCanal > 1) {
      const prevCanal = numCanal - 1;
      setNumCanal(prevCanal);
      setPeso(pesosMap[prevCanal]?.toString() || '');
    }
  };

  const handleNext = () => {
    guardarCanalActual();
    if (numCanal >= minCanales) return;
    setNumCanal(numCanal + 1);
    setPeso(pesosMap[numCanal + 1]?.toString() || '');
  };

  const pesoIngresado = peso || pesosMap[numCanal];
  const conteoMostrar = Object.keys(pesoIngresado ? { ...pesosMap, [numCanal]: parseFloat(peso || '0') } : pesosMap).length;
  const puedeFinalizar = conteoMostrar >= minCanales;
  const canalesFaltantes = minCanales - conteoMostrar;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <Header showBack />

        <View style={styles.centerWrapper}>
          <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <View style={styles.iconSection}>
            <Text style={[styles.title, { color: colors.text }]}>Peso/Canal</Text>
            <Image
              source={require('../../assets/images/entradas/canal.png')}
              style={styles.iconImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.numCanalContainer, { borderColor: colors.accent }]}>
              <Text style={[styles.label, { color: colors.text }]}>N° Canal</Text>
              <Text style={[styles.numCanal, { color: colors.text }]}>{numCanal}</Text>
            </View>

            <View style={[styles.inputPesoContainer, { borderColor: colors.accent }]}>
              <Text style={[styles.label, { color: colors.text }]}>Peso (kg)</Text>
              <View style={styles.inputRowInner}>
                <TextInput
                  style={[styles.inputPeso, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor="#888"
                  value={pesoActual}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, '');
                    const parts = filtered.split('.');
                    if (parts.length > 1) {
                      const newValue = parts[0].slice(0, 3) + '.' + parts[1].slice(0, 2);
                      setPeso(newValue);
                    } else {
                      const newValue = parts[0].slice(0, 3);
                      setPeso(newValue);
                    }
                  }}
                  keyboardType="decimal-pad"
                  textAlign="center"
                />
              </View>
            </View>
          </View>

          {pesoEfectivo !== null && taraActiva && (
            <View style={styles.taraResumen}>
              <Text style={[styles.taraResumenText, { color: colors.accent }]}>
                Destare: -{taraPeso.toFixed(2)} kg → Canal: {pesoEfectivo.toFixed(2)} kg
              </Text>
            </View>
          )}

          {personasCarga.length > 0 && (
            <View style={styles.taraSection}>
              <Text style={[styles.label, { color: colors.text }]}>Carga por persona (tara)</Text>
              {personasCarga.map((p, idx) => {
                const activa = taraMap[numCanal] === idx;
                return (
                  <TouchableOpacity
                    key={`${p.nombre}-${idx}`}
                    style={[
                      styles.taraButton,
                      { borderColor: activa ? colors.accent : '#aaa' },
                      activa && { backgroundColor: colors.accent + '22' },
                    ]}
                    onPress={() => toggleTara(idx)}
                  >
                    <MaterialCommunityIcons
                      name={activa ? 'scale-balance' : 'scale-unbalanced'}
                      size={20}
                      color={activa ? colors.accent : '#aaa'}
                    />
                    <Text style={[styles.taraButtonText, { color: activa ? colors.accent : '#aaa' }]}>
                      {p.nombre} ({p.peso.toFixed(2)} kg)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.navButtons}>
            <TouchableOpacity 
              style={[styles.navButton, { borderColor: colors.accent }]}
              onPress={handlePrev}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navButton, { borderColor: numCanal >= minCanales ? '#ccc' : colors.accent }]}
              disabled={numCanal >= minCanales}
              onPress={handleNext}
            >
              <MaterialCommunityIcons 
                name="arrow-right" 
                size={28} 
                color={numCanal >= minCanales ? '#ccc' : (peso ? colors.accent : '#ccc')} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.finalizarButton, { backgroundColor: puedeFinalizar ? colors.accent : '#888' }]}
            onPress={puedeFinalizar ? handleFinalizar : undefined}
          >
            <Text style={[styles.finalizarButtonText, { color: puedeFinalizar ? (isDark ? colors.background : colors.card) : '#ccc' }]}>
              {puedeFinalizar ? 'Finalizar' : `Faltan ${canalesFaltantes} canales`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>

      <Modal visible={showFinalizarModal} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: colors.card }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>¿Finalizar Pesaje?</Text>
<Text style={[modalStyles.message, { color: colors.text }]}>
              {conteoMostrar} canales pesados (mínimo: {minCanales})
            </Text>
            <View style={modalStyles.buttons}>
              <TouchableOpacity 
                style={[modalStyles.button, modalStyles.buttonCancel, { borderColor: colors.accent }]}
                onPress={() => setShowFinalizarModal(false)}
              >
                <Text style={[modalStyles.buttonText, { color: colors.accent }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[modalStyles.button, modalStyles.buttonAccept, { backgroundColor: colors.accent }]}
                onPress={confirmarFinalizar}
              >
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 40,
  },
  iconSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  iconImage: {
    width: 200,
    height: 200,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  numCanalContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  numCanal: {
    fontSize: 24,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    textAlign: 'center',
  },
  inputPesoContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  inputRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPeso: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    textAlign: 'center',
  },
  taraResumen: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  taraResumenText: {
    fontSize: 14,
    fontWeight: '700',
  },
  taraSection: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  taraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  taraButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 24,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalizarButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finalizarButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  buttonCancel: {
    borderWidth: 2,
  },
  buttonAccept: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
