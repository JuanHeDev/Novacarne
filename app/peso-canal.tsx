import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface PesoRegistro {
  numCanal: number;
  peso: number;
  fecha: Date;
}

type RegistrosMap = Record<number, number>;

export default function PesCanal() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, toggleTheme, colors } = useTheme();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [numCanal, setNumCanal] = useState(1);
  const [peso, setPeso] = useState('');
  const [registros, setRegistros] = useState<PesoRegistro[]>([]);
  const [pesosMap, setPesosMap] = useState<RegistrosMap>({});

  const isMobile = width < 768;
  const cardWidth = isMobile ? width * 0.9 : 400;

  const pesoActual = pesosMap[numCanal]?.toString() || peso;

  const handleFinalizar = () => {
    setShowFinalizarModal(true);
  };

  const confirmarFinalizar = () => {
    const pesosConActual = peso 
      ? { ...pesosMap, [numCanal]: parseFloat(peso) } 
      : pesosMap;
    
    const nuevosRegistros: PesoRegistro[] = Object.entries(pesosConActual).map(([canal, peso]) => ({
      numCanal: parseInt(canal),
      peso: peso,
      fecha: new Date(),
    }));
    setRegistros([...registros, ...nuevosRegistros]);
    console.log('Registros guardados:', nuevosRegistros);
    setShowFinalizarModal(false);
  };

  const handlePrev = () => {
    if (peso && !pesosMap[numCanal]) {
      setPesosMap({ ...pesosMap, [numCanal]: parseFloat(peso) });
    }
    if (numCanal > 1) {
      const prevCanal = numCanal - 1;
      setNumCanal(prevCanal);
      setPeso(pesosMap[prevCanal]?.toString() || '');
    }
  };

  const handleNext = () => {
    if (peso && !pesosMap[numCanal]) {
      setPesosMap({ ...pesosMap, [numCanal]: parseFloat(peso) });
    }
    setNumCanal(numCanal + 1);
    setPeso(pesosMap[numCanal + 1]?.toString() || '');
  };

  const pesoIngresado = peso || pesosMap[numCanal];
  const conteoMostrar = Object.keys(pesoIngresado ? { ...pesosMap, [numCanal]: parseFloat(peso) } : pesosMap).length;
  const minCanales = 10;
  const puedeFinalizar = conteoMostrar >= minCanales;
  const canalesFaltantes = minCanales - conteoMostrar;

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.iconButton, { backgroundColor: colors.accent }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

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

        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <View style={styles.iconSection}>
            <Text style={[styles.title, { color: colors.text }]}>Peso/Canal</Text>
            <Image
              source={require('../assets/images/canal.png')}
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
                      const newValue = parts[0].slice(0, 2) + '.' + parts[1].slice(0, 2);
                      setPeso(newValue);
                    } else {
                      const newValue = parts[0].slice(0, 2);
                      setPeso(newValue);
                    }
                  }}
                  keyboardType="decimal-pad"
                  textAlign="center"
                />
              </View>
            </View>
          </View>

          <View style={styles.navButtons}>
            <TouchableOpacity 
              style={[styles.navButton, { borderColor: colors.accent }]}
              onPress={handlePrev}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navButton, { borderColor: colors.accent }]}
              onPress={handleNext}
            >
              <MaterialCommunityIcons 
                name="arrow-right" 
                size={28} 
                color={peso ? colors.accent : '#ccc'} 
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
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
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
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