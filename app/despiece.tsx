import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const categorias = [
  { id: 1, nombre: 'Cortes primarios', icono: 'food-steak' },
  { id: 2, nombre: 'Cortes especiales', icono: 'food-variant' },
  { id: 3, nombre: 'Despojos y menudencia', icono: 'emoticon-outline' },
  { id: 4, nombre: 'Grasas y cueros', icono: 'water' },
  { id: 5, nombre: 'Huesos', icono: 'bone' },
];

const opcionesTara = {
  'Logística y Carga': [
    { id: 1, nombre: 'Carrito chorizo', peso: '30kg', icono: 'cart' },
    { id: 2, nombre: 'Diablito', peso: '16kg', icono: 'truck-delivery' },
  ],
  'Recipientes de Proceso': [
    { id: 3, nombre: 'Tinas metal 5kg', peso: '5kg', icono: 'water' },
    { id: 4, nombre: 'Tinas metal 8kg', peso: '8kg', icono: 'water' },
    { id: 5, nombre: 'Tina carnitas', peso: '10kg', icono: 'pot-steam' },
    { id: 6, nombre: 'Tina naranja', peso: '2.3kg', icono: 'pot-steam' },
  ],
  'Accesorios de Pesaje': [
    { id: 7, nombre: 'Gancho pesaje cerdos', peso: '3.390kg', icono: 'scale-bathroom' },
    { id: 8, nombre: 'Ganchos chorizo', peso: '0.28kg', icono: 'hook' },
  ],
  'Almacenaje y Empaque': [
    { id: 9, nombre: 'Cajas buche', peso: '0.5kg', icono: 'cube-outline' },
    { id: 10, nombre: 'Charolas 0.5kg', peso: '0.5kg', icono: 'square-outline' },
    { id: 11, nombre: 'Charolas 1.1kg', peso: '1.1kg', icono: 'square-outline' },
  ],
};

const categoriasTara = Object.keys(opcionesTara);

const cortesData = {
  'Cortes primarios': [
    { nombre: 'Pierna', icono: 'food-steak' },
    { nombre: 'Lomo', icono: 'food-steak' },
    { nombre: 'Cabeza de lomo', icono: 'food-steak' },
    { nombre: 'Filete', icono: 'food-steak' },
    { nombre: 'Espaldilla', icono: 'food-steak' },
  ],
  'Cortes especiales': [
    { nombre: 'Costilla', icono: 'food' },
    { nombre: 'Espinazo', icono: 'bone' },
    { nombre: 'Chamorro', icono: 'food' },
    { nombre: 'Entrecot', icono: 'food-steak' },
  ],
  'Despojos y menudencia': [
    { nombre: 'Cabeza/Mascara', icono: 'emoticon-outline' },
    { nombre: 'Lengua/Oreja/Sesos', icono: 'ear-hearing' },
    { nombre: 'Patas/Colas', icono: 'foot-print' },
    { nombre: 'Papada', icono: 'food-variant' },
  ],
  'Grasas y cueros': [
    { nombre: 'Grasa/Unto', icono: 'water' },
    { nombre: 'Tocino Natural', icono: 'food-variant' },
    { nombre: 'Cuero 1/2 Flor', icono: 'square' },
    { nombre: 'Recorte 80/20', icono: 'content-cut' },
  ],
  'Huesos': [
    { nombre: 'Hueso Pelon', icono: 'bone' },
    { nombre: 'Hueso Carne', icono: 'bone' },
    { nombre: 'Hueso Decomiso', icono: 'delete' },
  ],
};

export default function Despiece() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, toggleTheme, colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [showDropdownTara, setShowDropdownTara] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [taraCategoriaSeleccionada, setTaraCategoriaSeleccionada] = useState<string | null>(null);
  const [taraSeleccionada, setTaraSeleccionada] = useState<string | null>(null);
  const [taraAplicada, setTaraAplicada] = useState(false);
  const [taraAplicadaConfirmada, setTaraAplicadaConfirmada] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [taraPesos, setTaraPesos] = useState<Record<number, string>>({});
  const [pesos, setPesos] = useState<Record<string, string>>({});

  const isMobile = width < 768;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 900 : isMobile ? width * 0.95 : 700;
  const cardHeight = isWeb ? 120 : isMobile ? 80 : 100;
  const columnWidth = isWeb ? 350 : isMobile ? width * 0.42 : 280;

  const cortes = categoriaSeleccionada ? cortesData[categoriaSeleccionada as keyof typeof cortesData] || [] : [];

  const handlePesoChange = (corte: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    setPesos({ ...pesos, [corte]: finalValue });
  };

  const handleTaraInputChange = (id: number, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    setTaraPesos({ ...taraPesos, [id]: finalValue });
    const hasValue = finalValue.length > 0;
    setTaraAplicada(hasValue);
  };

  const handleAplicar = () => {
    const entries = Object.entries(taraPesos);
    const [[id, cantidad]] = entries.filter(([, val]) => val && val !== '0');
    if (!id) return;
    
    const taraItem = opcionesTara[taraCategoriaSeleccionada!].find(t => t.id === Number(id));
    if (!taraItem) return;
    
    const qty = parseFloat(cantidad);
    const pesoTara = parseFloat(taraItem.peso);
    const pesoTotal = qty * pesoTara;
    
    setTaraSeleccionada(`${taraItem.nombre} (${pesoTotal.toFixed(3)}kg)`);
    setTaraAplicadaConfirmada(true);
  };

  const handleEnviar = (corte: string) => {
    const pesoCorte = parseFloat(pesos[corte] || '0');
    
    if (!taraSeleccionada) {
      setModalMessage(`${pesoCorte}kg (sin tara aplicada)`);
      setShowModal(true);
      return;
    }
    
    const taraMatch = taraSeleccionada.match(/\(([\d.]+)kg\)/);
    const pesoTara = taraMatch ? parseFloat(taraMatch[1]) : 0;
    const pesoReal = pesoCorte - pesoTara;
    
    setModalMessage(`${pesoCorte}kg menos ${pesoTara}kg da un total de ${pesoReal.toFixed(3)}kg`);
    setShowModal(true);
  };

  const handleConfirmar = () => {
    setShowModal(false);
    setPesos({});
    setTaraPesos({});
    setTaraAplicada(false);
    setTaraAplicadaConfirmada(false);
    setTaraCategoriaSeleccionada(null);
    setTaraSeleccionada(null);
    setCategoriaSeleccionada(null);
  };

  const handleFinalizar = () => {
    setShowFinalizarModal(false);
    router.push({ pathname: '/entradas', params: { despieceCompletado: 'true' } });
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

      <Text style={[styles.title, { color: colors.text }]}>Despiece</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainContainer}>
          <View style={styles.leftColumn}>
            <View style={[styles.card, { backgroundColor: colors.card, width: columnWidth, minHeight: cardHeight }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Categoría</Text>
              <TouchableOpacity 
                style={[styles.dropdown, { borderColor: colors.accent }]}
                onPress={() => {
                  setShowDropdown1(!showDropdown1);
                  setShowDropdown2(false);
                  setShowDropdownTara(false);
                }}
              >
                <Text style={[styles.dropdownText, { color: categoriaSeleccionada ? colors.text : '#888' }]}>
                  {categoriaSeleccionada || 'Seleccionar'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
              </TouchableOpacity>
              
              {showDropdown1 && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                  {categorias.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategoriaSeleccionada(cat.nombre);
                        setShowDropdown1(false);
                      }}
                    >
                      <MaterialCommunityIcons name={cat.icono as any} size={18} color={colors.text} />
                      <Text style={[styles.dropdownItemText, { color: colors.text, marginLeft: 8 }]}>{cat.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, width: columnWidth, minHeight: cardHeight }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Tara</Text>
              <TouchableOpacity 
                style={[styles.dropdown, { borderColor: colors.accent }]}
                onPress={() => {
                  setShowDropdownTara(!showDropdownTara);
                  setShowDropdown1(false);
                  setShowDropdown2(false);
                }}
              >
                <Text style={[styles.dropdownText, { color: taraCategoriaSeleccionada ? colors.text : '#888' }]}>
                  {taraCategoriaSeleccionada || 'Seleccionar'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
              </TouchableOpacity>
              
              {showDropdownTara && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                  {categoriasTara.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setTaraCategoriaSeleccionada(cat);
                        setShowDropdownTara(false);
                      }}
                    >
                      <MaterialCommunityIcons name="package-variant" size={18} color={colors.text} />
                      <Text style={[styles.dropdownItemText, { color: colors.text, marginLeft: 8 }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={[styles.especificacionesContainer, { backgroundColor: colors.card, width: columnWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Especificaciones</Text>
              {taraCategoriaSeleccionada ? (
                <View style={styles.taraCardsRow}>
                  {opcionesTara[taraCategoriaSeleccionada].map((tara) => (
                    <View
                      key={tara.id}
                      style={[styles.taraCardRow, { borderColor: colors.accent }]}
                    >
                      <MaterialCommunityIcons name={tara.icono as any} size={22} color={colors.accent} />
                      <Text style={[styles.taraCardName, { color: colors.text }]}>{tara.nombre}</Text>
                      <Text style={[styles.taraCardPeso, { color: colors.accent }]}>{tara.peso}</Text>
                      <TextInput
                        style={[styles.taraInput, { borderColor: colors.accent, color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor="#888"
                        keyboardType="decimal-pad"
                        value={taraPesos[tara.id] || ''}
                        onChangeText={(value) => handleTaraInputChange(tara.id, value)}
                        editable={!taraAplicada}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.placeholderText, { color: '#888' }]}>Selecciona una categoría de Tara</Text>
              )}
              {taraCategoriaSeleccionada && (
                <TouchableOpacity 
                  style={[styles.aplicarButton, { backgroundColor: taraAplicadaConfirmada ? '#888' : (taraAplicada ? colors.accent : '#888') }]}
                  onPress={handleAplicar}
                  disabled={taraAplicadaConfirmada || !taraAplicada}
                >
                  <MaterialCommunityIcons name={taraAplicadaConfirmada ? "check" : "check"} size={18} color="#fff" />
                  <Text style={styles.aplicarText}>{taraAplicadaConfirmada ? 'Aplicado' : 'Aplicar'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, width: columnWidth, minHeight: 320 }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Cortes</Text>
              <View style={styles.cortesContainer}>
                {cortes.map((corte, index) => (
                  <View key={index} style={[styles.corteCard, { borderColor: colors.accent }]}>
                    <View style={styles.corteIconSection}>
                      <MaterialCommunityIcons name={corte.icono as any} size={isWeb ? 28 : 20} color={colors.accent} />
                    </View>
                    <Text style={[styles.corteName, { color: colors.text }]}>{corte.nombre}</Text>
                    <View style={styles.corteInputSection}>
                      <TextInput
                        style={[styles.pesoInput, { borderColor: colors.accent, color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor="#888"
                        value={pesos[corte.nombre] || ''}
                        onChangeText={(value) => handlePesoChange(corte.nombre, value)}
                        keyboardType="decimal-pad"
                      />
                      <Text style={[styles.kgLabel, { color: colors.text }]}>kg</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.enviarButton, { backgroundColor: colors.accent }]}
                      onPress={() => handleEnviar(corte.nombre)}
                    >
                      <MaterialCommunityIcons name="send" size={isWeb ? 14 : 10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={[styles.finalizarButton, { backgroundColor: colors.accent }]}
          onPress={() => setShowFinalizarModal(true)}
        >
          <MaterialCommunityIcons name="check" size={20} color="#fff" />
          <Text style={styles.finalizarButtonText}>Finalizar Despiece</Text>
        </TouchableOpacity>
      </View>

      {showModal && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirmar operación</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { borderColor: colors.accent }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleConfirmar}
              >
                <Text style={styles.modalButtonTextWhite}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showFinalizarModal && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Finalizar Despiece</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>¿Estás seguro de finalizar el despiece? Se cerrará el proceso de entrada.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { borderColor: colors.accent }]}
                onPress={() => setShowFinalizarModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleFinalizar}
              >
                <Text style={styles.modalButtonTextWhite}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  dropdownText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  mainContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  leftColumn: {
    alignItems: 'center',
    gap: 140,
  },
  rightColumn: {
    alignItems: 'center',
    gap: 10,
  },
  especificacionesContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 180,
  },
  taraCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 5,
    maxHeight: 300,
  },
  taraCardRow: {
    width: '30%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    minHeight: 100,
  },
  taraCardName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  taraCardPeso: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  taraInput: {
    width: 40,
    height: 24,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  aplicarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  aplicarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 14,
  },
  cortesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: 4,
    justifyContent: 'center',
  },
  corteCard: {
    width: '30%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 5,
    minHeight: 145,
    alignItems: 'center',
    margin: 2,
  },
  corteIconSection: {
    alignItems: 'center',
    marginBottom: 2,
  },
  corteName: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  corteInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 6,
    width: '100%',
    justifyContent: 'center',
  },
  pesoInput: {
    width: 35,
    borderWidth: 1,
    borderRadius: 6,
    padding: 1,
    fontSize: 9,
    minHeight: 22,
    textAlign: 'center',
  },
  kgLabel: {
    fontSize: 8,
    marginLeft: 1,
  },
  enviarButton: {
    width: 26,
    height: 26,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  footerContainer: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  finalizarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  finalizarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});