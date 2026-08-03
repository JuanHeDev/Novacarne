import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useDespiece, type CorteTara, type Registro } from '../../contexts/DespieceContext';
import { useEntradas } from '../../contexts/EntradasContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';

const categorias = [
  { id: 1, nombre: 'Cortes primarios', icono: 'food-steak' },
  { id: 2, nombre: 'Cortes especiales', icono: 'food-variant' },
  { id: 3, nombre: 'Despojos y menudencia', icono: 'emoticon-outline' },
  { id: 4, nombre: 'Grasas y cueros', icono: 'water' },
  { id: 5, nombre: 'Huesos', icono: 'bone' },
];

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

const categoriasTara = Object.keys(opcionesTara) as Array<keyof typeof opcionesTara>;

function parsePeso(pesoStr: string): number {
  return parseFloat(pesoStr.replace('kg', '')) || 0;
}

export default function Despiece() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [step, setStep] = useState<'categoria' | 'corte' | 'tara'>('categoria');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [corte, setCorte] = useState<string | null>(null);
  const [peso, setPeso] = useState('');

  const [aplicaTara, setAplicaTara] = useState<boolean | null>(null);
  const [taraCategoria, setTaraCategoria] = useState<string | null>(null);
  const [taraItem, setTaraItem] = useState<{ id: number; nombre: string; peso: string; icono: string } | null>(null);
  const [taraCantidad, setTaraCantidad] = useState('');
  const [taraDropdown, setTaraDropdown] = useState(false);
  const [taraCategoriaDropdown, setTaraCategoriaDropdown] = useState(false);

  const { registros, agregarRegistro, actualizarRegistro, eliminarRegistro } = useDespiece();
  const { completarDespiece, setDespieceConDatos } = useEntradas();
  const [editId, setEditId] = useState<string | null>(null);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 900 : isTablet ? 700 : width * 0.95;
  const catItemWidth = isMobile ? '47%' : isTablet ? '30%' : '22%';
  const corteItemWidth = isMobile ? '47%' : isTablet ? '30%' : '30%';
  const pasoLineWidth = isWeb ? 60 : isTablet ? 50 : 30;
  const titleSize = isWeb ? 32 : isTablet ? 28 : 24;
  const stepTitleSize = isWeb ? 22 : isTablet ? 20 : 18;
  const cardPadding = isWeb ? 32 : isTablet ? 28 : 20;

  const cortes = categoria ? cortesData[categoria as keyof typeof cortesData] || [] : [];

  function resetForm() {
    setCategoria(null);
    setCorte(null);
    setPeso('');
    setAplicaTara(null);
    setTaraCategoria(null);
    setTaraItem(null);
    setTaraCantidad('');
    setStep('categoria');
    setEditId(null);
  }

  function handleSelectCategoria(cat: string) {
    setCategoria(cat);
    setCorte(null);
    setPeso('');
    setAplicaTara(null);
    setTaraCategoria(null);
    setTaraItem(null);
    setTaraCantidad('');
    setStep('corte');
  }

  function handleSelectCorte(corteNombre: string) {
    setCorte(corteNombre);
    setPeso('');
  }

  function handleSiguientePeso() {
    if (!corte || !peso || parseFloat(peso) <= 0) {
      setAlertTitle('Error'); setAlertMessage('Ingresa un peso válido'); setAlertVisible(true);
      return;
    }
    setAplicaTara(null);
    setTaraCategoria(null);
    setTaraItem(null);
    setTaraCantidad('');
    setStep('tara');
  }

  function handleTaraNo() {
    guardarRegistro();
  }

  function guardarRegistro() {
    const pesoNum = parseFloat(peso) || 0;
    let taraData: CorteTara | undefined;
    if (taraItem && taraCantidad) {
      const pesoTaraUnidad = parsePeso(taraItem.peso);
      const cantidad = parseFloat(taraCantidad) || 0;
      taraData = {
        nombre: taraItem.nombre,
        peso: pesoTaraUnidad,
        cantidad,
      };
    }
    const pesoReal = taraData ? pesoNum - taraData.peso * taraData.cantidad : pesoNum;

    const registro: Registro = {
      id: Date.now().toString(),
      categoria: categoria!,
      corte: corte!,
      peso: pesoNum,
      tara: taraData,
      pesoReal,
    };

    if (editId) {
      actualizarRegistro(editId, registro);
    } else {
      agregarRegistro(registro);
    }

    resetForm();
  }

  function handleAplicarTara() {
    if (!taraItem || !taraCantidad || parseFloat(taraCantidad) <= 0) {
      setAlertTitle('Error'); setAlertMessage('Selecciona un elemento de tara y captura la cantidad'); setAlertVisible(true);
      return;
    }
    guardarRegistro();
  }

  function handleModificar(registro: Registro) {
    setCategoria(registro.categoria);
    setCorte(registro.corte);
    setPeso(registro.peso.toString());
    if (registro.tara) {
      setAplicaTara(true);
      setTaraItem({
        id: 0,
        nombre: registro.tara.nombre,
        peso: registro.tara.peso + 'kg',
        icono: 'scale-bathroom',
      });
      setTaraCantidad(registro.tara.cantidad.toString());
      for (const cat of categoriasTara) {
        for (const item of opcionesTara[cat]) {
          if (item.nombre === registro.tara.nombre) {
            setTaraCategoria(cat);
            setTaraItem(item);
            break;
          }
        }
      }
    } else {
      setAplicaTara(false);
    }
    setEditId(registro.id);
    setStep('corte');
  }

  function handleEliminar(id: string) {
    eliminarRegistro(id);
    if (editId === id) resetForm();
  }

  function handleFinalizar() {
    setShowFinalizarModal(true);
  }

  function confirmarFinalizar() {
    setShowFinalizarModal(false);
    completarDespiece();
    setAlertTitle('Enviado'); setAlertMessage('Despiece enviado correctamente'); setAlertVisible(true);
    router.back();
  }

  function renderPasoNumero(num: number, label: string, activo: boolean) {
    const col = step === 'categoria' && num === 1 || step === 'corte' && num === 2 || step === 'tara' && num === 3;
    return (
      <View style={[styles.paso, { backgroundColor: activo ? colors.accent : (col ? colors.accent + '33' : colors.card), borderColor: activo ? colors.accent : colors.accent + '44' }]}>
        <Text style={[styles.pasoNum, { color: activo ? '#fff' : colors.text }]}>{num}</Text>
        <Text style={[styles.pasoLabel, { color: activo ? '#fff' : colors.text, fontWeight: activo ? '600' : '400' }]}>{label}</Text>
      </View>
    );
  }

  function renderRegistros() {
    if (registros.length === 0) return null;
    return (
      <View style={[styles.registrosCard, { backgroundColor: colors.card, width: cardWidth }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Registros capturados ({registros.length})</Text>
        {registros.map(r => (
          <View key={r.id} style={[styles.registroRow, { borderColor: colors.accent + '44' }]}>
            <View style={styles.registroInfo}>
              <Text style={[styles.registroCorte, { color: colors.text }]}>{r.corte}</Text>
              <Text style={[styles.registroDetalle, { color: colors.text + '99' }]}>
                {r.categoria} · {r.peso}kg{r.tara ? ` · Tara: ${r.tara.nombre} x${r.tara.cantidad}` : ''}
                {r.pesoReal !== r.peso ? ` · Real: ${r.pesoReal.toFixed(3)}kg` : ''}
              </Text>
            </View>
            <View style={styles.registroAcciones}>
              <TouchableOpacity style={[styles.accionBtn, { backgroundColor: colors.accent + '22' }]} onPress={() => handleModificar(r)}>
                <MaterialCommunityIcons name="pencil" size={16} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#e74c3c22' }]} onPress={() => handleEliminar(r.id)}>
                <MaterialCommunityIcons name="delete" size={16} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack onBackPress={() => { setDespieceConDatos(registros.length > 0); router.back(); }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: colors.text, fontSize: titleSize }]}>Despiece</Text>
        <View style={[styles.mainCard, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
          <View style={styles.pasosRow}>
            {renderPasoNumero(1, 'Categoría', step === 'categoria')}
            <View style={[styles.pasoLinea, { borderColor: colors.accent + '44', width: pasoLineWidth }]} />
            {renderPasoNumero(2, 'Corte y peso', step === 'corte')}
            <View style={[styles.pasoLinea, { borderColor: colors.accent + '44', width: pasoLineWidth }]} />
            {renderPasoNumero(3, 'Tara', step === 'tara')}
          </View>

          {step === 'categoria' && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Selecciona una categoría</Text>
              <View style={styles.categoriasGrid}>
                {categorias.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoriaCard, { backgroundColor: cat.nombre === categoria ? colors.accent : colors.accent + '15', borderColor: cat.nombre === categoria ? colors.accent : 'transparent', width: catItemWidth }]}
                    onPress={() => handleSelectCategoria(cat.nombre)}
                  >
                    <MaterialCommunityIcons name={cat.icono as any} size={28} color={cat.nombre === categoria ? '#fff' : colors.accent} />
                    <Text style={[styles.categoriaText, { color: cat.nombre === categoria ? '#fff' : colors.text }]}>{cat.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 'corte' && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>{editId ? 'Modificar' : 'Nuevo'} registro</Text>
              {categoria && (
                <View style={styles.categoriaBadge}>
                  <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>{categoria}</Text>
                </View>
              )}
              <Text style={[styles.sectionLabel, { color: colors.text + 'aa' }]}>Selecciona el corte</Text>
              <View style={styles.cortesGrid}>
                {cortes.map(c => (
                  <TouchableOpacity
                    key={c.nombre}
                    style={[styles.corteCard, { backgroundColor: c.nombre === corte ? colors.accent : colors.accent + '10', borderColor: c.nombre === corte ? colors.accent : 'transparent', width: corteItemWidth }]}
                    onPress={() => handleSelectCorte(c.nombre)}
                  >
                    <MaterialCommunityIcons name={c.icono as any} size={24} color={c.nombre === corte ? '#fff' : colors.accent} />
                    <Text style={[styles.corteName, { color: c.nombre === corte ? '#fff' : colors.text }]}>{c.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {corte && (
                <View style={styles.pesoContainer}>
                  <Text style={[styles.sectionLabel, { color: colors.text + 'aa' }]}>Peso del corte (kg)</Text>
                  <TextInput
                    style={[styles.pesoInput, { borderColor: colors.accent, color: colors.text }]}
                    placeholder="0.000"
                    placeholderTextColor="#888"
                    keyboardType="decimal-pad"
                    value={peso}
                    onChangeText={t => setPeso(t.replace(/[^0-9.]/g, ''))}
                  />
                  <View style={styles.stepButtons}>
                    <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.accent }]} onPress={resetForm}>
                      <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: peso && parseFloat(peso) > 0 ? 1 : 0.5 }]} onPress={handleSiguientePeso} disabled={!peso || parseFloat(peso) <= 0}>
                      <Text style={styles.primaryBtnText}>Siguiente</Text>
                      <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {step === 'tara' && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>¿Aplicar tara?</Text>
              <View style={styles.categoriaBadge}>
                <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 13 }}>{categoria} · {corte} · {peso}kg</Text>
              </View>
              {aplicaTara === null ? (
                <View style={styles.taraButtons}>
                  <TouchableOpacity style={[styles.taraChoiceBtn, { backgroundColor: '#4CAF50', marginRight: 12 }]} onPress={() => setAplicaTara(true)}>
                    <MaterialCommunityIcons name="check" size={24} color="#fff" />
                    <Text style={styles.taraChoiceText}>Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.taraChoiceBtn, { backgroundColor: '#e74c3c' }]} onPress={handleTaraNo}>
                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                    <Text style={styles.taraChoiceText}>No</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.taraPanel}>
                  <Text style={[styles.sectionLabel, { color: colors.text + 'aa' }]}>Categoría de tara</Text>
                  <TouchableOpacity
                    style={[styles.taraDropdown, { borderColor: colors.accent }]}
                    onPress={() => setTaraCategoriaDropdown(!taraCategoriaDropdown)}
                  >
                    <Text style={[styles.taraDropdownText, { color: taraCategoria ? colors.text : '#888' }]}>
                      {taraCategoria || 'Seleccionar'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
                  </TouchableOpacity>
                  {taraCategoriaDropdown && (
                    <View style={[styles.taraDropdownMenu, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                      {categoriasTara.map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.taraDropdownItem}
                          onPress={() => { setTaraCategoria(cat); setTaraItem(null); setTaraCategoriaDropdown(false); }}
                        >
                          <MaterialCommunityIcons name="package-variant" size={18} color={colors.text} />
                          <Text style={[styles.taraDropdownItemText, { color: colors.text, marginLeft: 8 }]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {taraCategoria && (
                    <>
                      <Text style={[styles.sectionLabel, { color: colors.text + 'aa', marginTop: 12 }]}>Elemento de tara</Text>
                      {opcionesTara[taraCategoria].map(item => (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.taraItemCard, { borderColor: taraItem?.id === item.id ? colors.accent : colors.accent + '33', backgroundColor: taraItem?.id === item.id ? colors.accent + '15' : 'transparent' }]}
                          onPress={() => setTaraItem(item)}
                        >
                          <MaterialCommunityIcons name={item.icono as any} size={22} color={taraItem?.id === item.id ? colors.accent : colors.text + '99'} />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.taraItemName, { color: colors.text }]}>{item.nombre}</Text>
                            <Text style={[styles.taraItemPeso, { color: colors.accent }]}>{item.peso}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      <Text style={[styles.sectionLabel, { color: colors.text + 'aa', marginTop: 12 }]}>Cantidad</Text>
                      <TextInput
                        style={[styles.pesoInput, { borderColor: colors.accent, color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor="#888"
                        keyboardType="decimal-pad"
                        value={taraCantidad}
                        onChangeText={t => setTaraCantidad(t.replace(/[^0-9.]/g, ''))}
                      />
                    </>
                  )}
                  <View style={styles.stepButtons}>
                    <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.accent }]} onPress={handleTaraNo}>
                      <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>Sin tara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: taraItem && taraCantidad ? 1 : 0.5 }]}
                      onPress={handleAplicarTara}
                      disabled={!taraItem || !taraCantidad}
                    >
                      <Text style={styles.primaryBtnText}>Guardar</Text>
                      <MaterialCommunityIcons name="check" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {renderRegistros()}

        {registros.length > 0 && (
          <TouchableOpacity style={[styles.finalizarBtn, { backgroundColor: colors.accent }]} onPress={handleFinalizar}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
            <Text style={styles.finalizarBtnText}>Finalizar Despiece ({registros.length} cortes)</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {showFinalizarModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, width: isMobile ? width * 0.9 : isTablet ? 500 : 600 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Finalizar Despiece</Text>
            <Text style={[styles.modalSubtitle, { color: colors.text + '99' }]}>
              ¿Está seguro que los datos capturados son correctos?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowFinalizarModal(false)}>
                <Text style={[styles.modalBtnText, { color: '#888' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm, { backgroundColor: colors.accent }]} onPress={confirmarFinalizar}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Confirmar y enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <AlertModal visible={alertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40, paddingHorizontal: 16, paddingTop: 24 },
  mainCard: { borderRadius: 20, padding: 24, marginBottom: 16,elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  pasosRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  paso: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2 },
  pasoNum: { fontSize: 14, fontWeight: 'bold', marginRight: 6 },
  pasoLabel: { fontSize: 13 },
  pasoLinea: { width: 40, borderBottomWidth: 2, marginHorizontal: 8 },
  stepContent: { },
  stepTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  categoriaCard: {
    paddingVertical: 20, paddingHorizontal: 16, borderRadius: 14,
    alignItems: 'center', borderWidth: 2, marginBottom: 4,
  },
  categoriaText: { fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  categoriaBadge: {
    alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginBottom: 16,
  },
  cortesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  corteCard: {
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12,
    alignItems: 'center', borderWidth: 2, flexDirection: 'row', gap: 10,
  },
  corteName: { fontSize: 14, fontWeight: '600' },
  pesoContainer: { marginTop: 16 },
  pesoInput: {
    width: '100%', height: 50, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 20, fontWeight: 'bold', textAlign: 'center',
    marginBottom: 12,
  },
  stepButtons: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  secondaryBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 2 },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
  primaryBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  taraButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  taraChoiceBtn: { width: 120, paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  taraChoiceText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  taraPanel: { marginTop: 12 },
  taraDropdown: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'space-between' },
  taraDropdownText: { fontSize: 15 },
  taraDropdownMenu: { borderWidth: 1, borderRadius: 12, marginTop: 4, padding: 4, elevation: 4 },
  taraDropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  taraDropdownItemText: { fontSize: 14 },
  taraItemCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 6 },
  taraItemName: { fontSize: 14, fontWeight: '500' },
  taraItemPeso: { fontSize: 12, fontWeight: '600' },
  registrosCard: { borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  registroRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 10 },
  registroInfo: { flex: 1 },
  registroCorte: { fontSize: 15, fontWeight: '600' },
  registroDetalle: { fontSize: 12, marginTop: 2 },
  registroAcciones: { flexDirection: 'row', gap: 8 },
  accionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  finalizarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, gap: 8, width: '100%' },
  finalizarBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { borderRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  modalBtnCancel: { borderWidth: 1, borderColor: '#ddd' },
  modalBtnConfirm: {},
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
