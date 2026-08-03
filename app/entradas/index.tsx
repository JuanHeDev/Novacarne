import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Header from '../../components/Header';
import { useCanal } from '../../contexts/CanalContext';
import { useDespiece } from '../../contexts/DespieceContext';
import { useEntradas } from '../../contexts/EntradasContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Entradas() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const { resetRegistros: resetDespieceRegistros } = useDespiece();
  const { resetRegistros: resetCanalRegistros } = useCanal();
  const {
    nuevoLoteActivo, canalCompletado, despieceHabilitado, despieceCompletado, despieceConDatos,
    setNuevoLoteActivo, setCantidadCanales, setPersonasCarga,
    finalizarLote,
  } = useEntradas();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cantidadInput, setCantidadInput] = useState('');
  const [cargaPorPersona, setCargaPorPersona] = useState(false);
  const [persona1Nombre, setPersona1Nombre] = useState('');
  const [persona1Peso, setPersona1Peso] = useState('');
  const [persona2Nombre, setPersona2Nombre] = useState('');
  const [persona2Peso, setPersona2Peso] = useState('');

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
    setCantidadInput('');
    setCargaPorPersona(false);
    setPersona1Nombre('');
    setPersona1Peso('');
    setPersona2Nombre('');
    setPersona2Peso('');
    setShowConfigModal(true);
  };

  const handleConfirmarConfig = () => {
    const cantidad = parseInt(cantidadInput, 10);
    if (!cantidadInput.trim() || isNaN(cantidad) || cantidad <= 0) return;

    const personas = [];
    if (cargaPorPersona) {
      if (persona1Nombre.trim() && persona1Peso.trim()) {
        const p1 = parseFloat(persona1Peso);
        if (!isNaN(p1) && p1 > 0) personas.push({ nombre: persona1Nombre.trim(), peso: p1 });
      }
      if (persona2Nombre.trim() && persona2Peso.trim()) {
        const p2 = parseFloat(persona2Peso);
        if (!isNaN(p2) && p2 > 0) personas.push({ nombre: persona2Nombre.trim(), peso: p2 });
      }
      if (personas.length === 0) return;
    }

    setCantidadCanales(cantidad);
    setPersonasCarga(personas);
    setShowConfigModal(false);
    router.push('/entradas/peso-canal');
  };

  const handleFinalizarLote = () => {
    finalizarLote();
    resetDespieceRegistros();
    resetCanalRegistros();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Header showBack />

      <View style={styles.centerWrapper}>
      <View style={[styles.mainCard, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
        <Image
            source={require('../../assets/images/entradas/cuchillo.png')}
            style={styles.iconImage}
        />
        <View style={styles.contentColumn}>
          {!nuevoLoteActivo ? (
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
              style={[styles.subButton, { borderColor: canalCompletado ? '#aaa' : (nuevoLoteActivo ? colors.accent : '#aaa') }]}
              disabled={!nuevoLoteActivo || canalCompletado}
              onPress={handleCanal}
            >
              <MaterialCommunityIcons name="pig" size={24} color={canalCompletado ? '#aaa' : (nuevoLoteActivo ? colors.text : '#aaa')} />
              <Text style={[styles.subButtonText, { color: canalCompletado ? '#aaa' : (nuevoLoteActivo ? colors.text : '#aaa') }]}>
                1. Canal
              </Text>
              {canalCompletado && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.subButton, { borderColor: despieceCompletado ? '#aaa' : (despieceHabilitado ? colors.accent : '#aaa') }]}
              disabled={!despieceHabilitado || despieceCompletado}
              onPress={() => router.push('/entradas/despiece')}
            >
              <MaterialCommunityIcons name="knife" size={24} color={despieceCompletado ? '#aaa' : (despieceHabilitado ? colors.text : '#aaa')} />
              <Text style={[styles.subButtonText, { color: despieceCompletado ? '#aaa' : (despieceHabilitado ? colors.text : '#aaa') }]}>
                2. Despiece
              </Text>
              {(despieceCompletado || despieceConDatos) && (
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

      {/* ——— MODAL CONFIGURACIÓN DE CANALES ——— */}
      <Modal visible={showConfigModal} transparent animationType="fade" onRequestClose={() => setShowConfigModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: colors.card, width: isMobile ? width * 0.92 : 460 }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Configurar canales</Text>

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Cantidad de canales a capturar</Text>
            <TextInput
              style={[modalStyles.input, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Ej. 10"
              placeholderTextColor="#888"
              value={cantidadInput}
              onChangeText={text => setCantidadInput(text.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
            />

            <View style={modalStyles.switchRow}>
              <Text style={[modalStyles.switchLabel, { color: colors.text }]}>Cargado de canales por persona</Text>
              <Switch
                value={cargaPorPersona}
                onValueChange={setCargaPorPersona}
                trackColor={{ false: '#888', true: colors.accent }}
                thumbColor={cargaPorPersona ? '#fff' : '#ccc'}
              />
            </View>

            {cargaPorPersona && (
              <>
                <View style={modalStyles.personRow}>
                  <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Persona 1</Text>
                  <TextInput
                    style={[modalStyles.input, { borderColor: colors.accent, color: colors.text }]}
                    placeholder="Nombre"
                    placeholderTextColor="#888"
                    value={persona1Nombre}
                    onChangeText={setPersona1Nombre}
                  />
                  <TextInput
                    style={[modalStyles.input, { borderColor: colors.accent, color: colors.text }]}
                    placeholder="Peso (kg)"
                    placeholderTextColor="#888"
                    value={persona1Peso}
                    onChangeText={text => setPersona1Peso(text.replace(/[^0-9.]/g, '').slice(0, 5))}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={modalStyles.personRow}>
                  <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Persona 2 (opcional)</Text>
                  <TextInput
                    style={[modalStyles.input, { borderColor: colors.accent, color: colors.text }]}
                    placeholder="Nombre"
                    placeholderTextColor="#888"
                    value={persona2Nombre}
                    onChangeText={setPersona2Nombre}
                  />
                  <TextInput
                    style={[modalStyles.input, { borderColor: colors.accent, color: colors.text }]}
                    placeholder="Peso (kg)"
                    placeholderTextColor="#888"
                    value={persona2Peso}
                    onChangeText={text => setPersona2Peso(text.replace(/[^0-9.]/g, '').slice(0, 5))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </>
            )}

            <View style={modalStyles.buttons}>
              <TouchableOpacity style={[modalStyles.button, modalStyles.buttonCancel, { borderColor: colors.accent }]} onPress={() => setShowConfigModal(false)}>
                <Text style={[modalStyles.buttonText, { color: colors.accent }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.button, modalStyles.buttonAccept, { backgroundColor: cantidadInput.trim() ? colors.accent : '#888' }]} onPress={handleConfirmarConfig} disabled={!cantidadInput.trim()}>
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 20,
    padding: 24,
    gap: 10,
    alignItems: 'stretch',
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    width: '100%',
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  personRow: {
    gap: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
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
