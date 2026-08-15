import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useDespiece, type CorteTara, type Registro } from '../../contexts/DespieceContext';
import { useEntradas } from '../../contexts/EntradasContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';
import { supabase } from '../../lib/supabase';
import { getPerfil } from '../../lib/perfil';

interface ProductoDespiece {
  id: string;
  nombre: string;
  categoria: string;
  sub_categoria: string | null;
}

type Step = 'canal' | 'categoria' | 'corte' | 'tara';

const ordenPasos: Record<Step, number> = { canal: 1, categoria: 2, corte: 3, tara: 4 };

const taraOpciones = [
  { id: 1, nombre: 'Diablito', peso: '16kg', icono: 'truck-delivery' },
  { id: 2, nombre: 'Tina metal 1', peso: '5kg', icono: 'water' },
  { id: 3, nombre: 'Tina metal 2', peso: '8kg', icono: 'water' },
  { id: 4, nombre: 'Tina naranja', peso: '2.3kg', icono: 'pot-steam' },
  { id: 5, nombre: 'Cajas buche', peso: '0.5kg', icono: 'cube-outline' },
  { id: 6, nombre: 'Charola 1', peso: '0.5kg', icono: 'square-outline' },
  { id: 7, nombre: 'Charola 2', peso: '1.1kg', icono: 'square-outline' },
];

const TARA_ESPECIAL = { id: 99, nombre: 'Tara especial', peso: '0kg', icono: 'scale' };

function parsePeso(pesoStr: string): number {
  return parseFloat(pesoStr.replace('kg', '')) || 0;
}

function iconoSubcategoria(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('primario')) return 'food-steak';
  if (c.includes('especial')) return 'food-variant';
  if (c.includes('despojo') || c.includes('menudencia')) return 'emoticon-outline';
  if (c.includes('grasa') || c.includes('cuero')) return 'water';
  if (c.includes('hueso')) return 'bone';
  return 'food-steak';
}

export default function Despiece() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [step, setStep] = useState<Step>('canal');
  const [numCanal, setNumCanal] = useState<number | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [corte, setCorte] = useState<string | null>(null);
  const [peso, setPeso] = useState('');

  const [aplicaTara, setAplicaTara] = useState<boolean | null>(null);
  const [taraItem, setTaraItem] = useState<{ id: number; nombre: string; peso: string; icono: string } | null>(null);
  const [taraEspecial, setTaraEspecial] = useState(false);
  const [taraEspecialPeso, setTaraEspecialPeso] = useState('');
  const [taraCantidad, setTaraCantidad] = useState('');

  const { registros, agregarRegistro, actualizarRegistro, eliminarRegistro } = useDespiece();
  const { completarDespiece, setDespieceConDatos } = useEntradas();
  const [editId, setEditId] = useState<string | null>(null);

  const [productos, setProductos] = useState<ProductoDespiece[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [canales, setCanales] = useState<{ num_canal: number; peso: number }[]>([]);
  const [cargandoCanales, setCargandoCanales] = useState(true);

  const canalesCompletados = canales.filter(c => registros.some(r => r.numCanal === c.num_canal));
  const canalesPendientes = canales.filter(c => !registros.some(r => r.numCanal === c.num_canal));
  const puedeFinalizar = canales.length > 0 && canalesPendientes.length === 0;

  useEffect(() => {
    fetchProductos();
    fetchCanales();
  }, []);

  const fetchProductos = async () => {
    setCargandoProductos(true);
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, categoria, sub_categoria')
      .eq('categoria', 'carnes')
      .is('deleted_at', null)
      .order('nombre', { ascending: true });
    if (!error && data) setProductos(data);
    else if (error) console.error('Error fetching productos:', JSON.stringify(error, null, 2));
    setCargandoProductos(false);
  };

  const fetchCanales = async () => {
    setCargandoCanales(true);
    const perfil = await getPerfil();
    if (!perfil?.sucursal_id) {
      setCargandoCanales(false);
      return;
    }
    const { data, error } = await supabase
      .from('lotes_entrada')
      .select('pesos_canales')
      .eq('sucursal_id', perfil.sucursal_id)
      .not('pesos_canales', 'is', null)
      .order('fecha_recepcion', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data?.pesos_canales) setCanales(data.pesos_canales);
    else if (error) console.error('Error fetching canales:', JSON.stringify(error, null, 2));
    setCargandoCanales(false);
  };

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 900 : isTablet ? 700 : width * 0.95;
  const catItemWidth = isMobile ? '47%' : isTablet ? '30%' : '22%';
  const corteItemWidth = isMobile ? '47%' : isTablet ? '30%' : '30%';
  const pasoLineWidth = isWeb ? 60 : isTablet ? 50 : 30;
  const titleSize = isWeb ? 32 : isTablet ? 28 : 24;
  const cardPadding = isWeb ? 32 : isTablet ? 28 : 20;

  const categorias = Array.from(new Set(productos.map(p => p.sub_categoria?.trim()).filter(Boolean) as string[])).sort();

  const cortes = categoria ? productos.filter(p => p.sub_categoria === categoria) : [];

  function resetForm() {
    setCategoria(null);
    setCorte(null);
    setPeso('');
    setAplicaTara(null);
    setTaraItem(null);
    setTaraEspecial(false);
    setTaraEspecialPeso('');
    setTaraCantidad('');
    setStep('categoria');
    setEditId(null);
  }

  function seleccionarCanal(n: number) {
    setNumCanal(n);
    setCategoria(null);
    setCorte(null);
    setPeso('');
    setAplicaTara(null);
    setTaraItem(null);
    setTaraEspecial(false);
    setTaraEspecialPeso('');
    setTaraCantidad('');
    setEditId(null);
    setStep('categoria');
  }

  function handleSelectCategoria(cat: string) {
    setCategoria(cat);
    setCorte(null);
    setPeso('');
    setAplicaTara(null);
    setTaraItem(null);
    setTaraEspecial(false);
    setTaraEspecialPeso('');
    setTaraCantidad('');
    setStep('corte');
  }

  function handleSelectCorte(corteNombre: string) {
    setCorte(corteNombre);
    setPeso('');
  }

  function seleccionarTara(item: { id: number; nombre: string; peso: string; icono: string }) {
    setTaraItem(item);
    setTaraEspecial(item.id === TARA_ESPECIAL.id);
  }

  function volverPaso() {
    if (step === 'tara') {
      setStep('corte');
    } else if (step === 'corte') {
      setCorte(null);
      setPeso('');
      setEditId(null);
      setStep('categoria');
    } else if (step === 'categoria') {
      setEditId(null);
      setStep('canal');
    }
  }

  function handleSiguientePeso() {
    if (!corte || !peso || parseFloat(peso) <= 0) {
      setAlertTitle('Error'); setAlertMessage('Ingresa un peso válido'); setAlertVisible(true);
      return;
    }
    setAplicaTara(null);
    setTaraItem(null);
    setTaraEspecial(false);
    setTaraEspecialPeso('');
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
      const pesoTaraUnidad = taraItem.id === TARA_ESPECIAL.id ? (parseFloat(taraEspecialPeso) || 0) : parsePeso(taraItem.peso);
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
      numCanal: numCanal ?? 0,
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
    if (taraEspecial && (!taraEspecialPeso || parseFloat(taraEspecialPeso) <= 0)) {
      setAlertTitle('Error'); setAlertMessage('Especifica el peso de la tara especial'); setAlertVisible(true);
      return;
    }
    guardarRegistro();
  }

  function handleModificar(registro: Registro) {
    setNumCanal(registro.numCanal);
    setCategoria(registro.categoria);
    setCorte(registro.corte);
    setPeso(registro.peso.toString());
    if (registro.tara) {
      setAplicaTara(true);
      setTaraCantidad(registro.tara.cantidad.toString());
      const itemEncontrado = taraOpciones.find(o => o.nombre === registro.tara.nombre);
      if (itemEncontrado) {
        setTaraItem(itemEncontrado);
        setTaraEspecial(false);
      } else {
        setTaraItem(TARA_ESPECIAL);
        setTaraEspecial(true);
        setTaraEspecialPeso(registro.tara.peso.toString());
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

  function renderPasoNumero(num: number, label: string) {
    const activo = ordenPasos[step] === num;
    const pasado = ordenPasos[step] > num;
    return (
      <View style={[styles.paso, { backgroundColor: activo ? colors.accent : (pasado ? colors.accent + '33' : colors.card), borderColor: activo ? colors.accent : colors.accent + '44' }]}>
        <Text style={[styles.pasoNum, { color: activo ? '#fff' : colors.text }]}>{num}</Text>
        <Text style={[styles.pasoLabel, { color: activo ? '#fff' : colors.text, fontWeight: activo ? '600' : '400' }]}>{label}</Text>
      </View>
    );
  }

  function renderRegistros() {
    const registrosFiltrados = numCanal !== null ? registros.filter(r => r.numCanal === numCanal) : registros;
    if (registrosFiltrados.length === 0) return null;
    return (
      <View style={[styles.registrosCard, { backgroundColor: colors.card, width: cardWidth }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {numCanal !== null ? `Registros del Canal ${numCanal} (${registrosFiltrados.length})` : `Registros capturados (${registrosFiltrados.length})`}
        </Text>
        {registrosFiltrados.map(r => (
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
        <Image source={require('../../assets/images/entradas/cerdo cortes.jpg')} style={styles.cardImage} contentFit="contain" />
        <View style={[styles.mainCard, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
          <View style={styles.pasosRow}>
            {renderPasoNumero(1, 'Canal')}
            <View style={[styles.pasoLinea, { borderColor: colors.accent + '44', width: pasoLineWidth }]} />
            {renderPasoNumero(2, 'Categoría')}
            <View style={[styles.pasoLinea, { borderColor: colors.accent + '44', width: pasoLineWidth }]} />
            {renderPasoNumero(3, 'Corte y peso')}
            <View style={[styles.pasoLinea, { borderColor: colors.accent + '44', width: pasoLineWidth }]} />
            {renderPasoNumero(4, 'Tara')}
          </View>
          {step !== 'canal' && (
            <TouchableOpacity style={[styles.volverBtn, { borderColor: colors.accent + '44', backgroundColor: colors.accent + '15' }]} onPress={volverPaso}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.accent} />
            </TouchableOpacity>
          )}

          {step === 'canal' && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Selecciona un canal</Text>
              {cargandoCanales ? (
                <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
              ) : canales.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                  No hay canales disponibles para tu sucursal.
                </Text>
              ) : (
                <View style={styles.canalGrid}>
                  {canales.map(c => {
                    const conCortes = registros.some(r => r.numCanal === c.num_canal);
                    const seleccionado = numCanal === c.num_canal;
                    return (
                      <TouchableOpacity
                        key={c.num_canal}
                        style={[styles.canalCard, {
                          backgroundColor: seleccionado ? colors.accent : colors.accent + '15',
                          borderColor: seleccionado ? colors.accent : (conCortes ? '#4CAF50' : 'transparent'),
                        }]}
                        onPress={() => seleccionarCanal(c.num_canal)}
                      >
                        <Text style={[styles.canalCardNum, { color: seleccionado ? '#fff' : colors.text }]}>
                          Canal {c.num_canal}
                        </Text>
                        <Text style={[styles.canalCardPeso, { color: seleccionado ? '#fff' : colors.text + '99' }]}>
                          {c.peso.toFixed(2)} kg
                        </Text>
                        {conCortes && (
                          <MaterialCommunityIcons name="check-circle" size={18} color={seleccionado ? '#fff' : '#4CAF50'} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {step === 'categoria' && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Selecciona una categoría</Text>
              {cargandoProductos ? (
                <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
              ) : categorias.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                  No hay subcategorías disponibles.
                </Text>
              ) : (
                <View style={styles.categoriasGrid}>
                  {categorias.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoriaCard, { backgroundColor: cat === categoria ? colors.accent : colors.accent + '15', borderColor: cat === categoria ? colors.accent : 'transparent', width: catItemWidth }]}
                      onPress={() => handleSelectCategoria(cat)}
                    >
                      <MaterialCommunityIcons name={iconoSubcategoria(cat) as any} size={28} color={cat === categoria ? '#fff' : colors.accent} />
                      <Text style={[styles.categoriaText, { color: cat === categoria ? '#fff' : colors.text }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
              {cargandoProductos ? (
                <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
              ) : cortes.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                  No hay productos registrados en esta categoría.
                </Text>
              ) : (
                <View style={styles.cortesGrid}>
                  {cortes.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.corteCard, { backgroundColor: c.nombre === corte ? colors.accent : colors.accent + '10', borderColor: c.nombre === corte ? colors.accent : 'transparent', width: corteItemWidth }]}
                      onPress={() => handleSelectCorte(c.nombre)}
                    >
                      <MaterialCommunityIcons name="food-steak" size={24} color={c.nombre === corte ? '#fff' : colors.accent} />
                      <Text style={[styles.corteName, { color: c.nombre === corte ? '#fff' : colors.text }]}>{c.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
                  <Text style={[styles.sectionLabel, { color: colors.text + 'aa' }]}>Selecciona el elemento de tara</Text>
                  <View style={styles.taraGrid}>
                    {taraOpciones.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.taraItemCard, { borderColor: taraItem?.id === item.id ? colors.accent : colors.accent + '33', backgroundColor: taraItem?.id === item.id ? colors.accent + '15' : 'transparent' }]}
                        onPress={() => seleccionarTara(item)}
                      >
                        <MaterialCommunityIcons name={item.icono as any} size={26} color={taraItem?.id === item.id ? colors.accent : colors.text + '99'} />
                        <Text style={[styles.taraItemName, { color: colors.text }]}>{item.nombre}</Text>
                        <Text style={[styles.taraItemPeso, { color: colors.accent }]}>{item.peso}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.taraItemCard, { borderColor: taraItem?.id === TARA_ESPECIAL.id ? colors.accent : colors.accent + '33', backgroundColor: taraItem?.id === TARA_ESPECIAL.id ? colors.accent + '15' : 'transparent' }]}
                      onPress={() => seleccionarTara(TARA_ESPECIAL)}
                    >
                      <MaterialCommunityIcons name={TARA_ESPECIAL.icono as any} size={26} color={taraItem?.id === TARA_ESPECIAL.id ? colors.accent : colors.text + '99'} />
                      <Text style={[styles.taraItemName, { color: colors.text }]}>{TARA_ESPECIAL.nombre}</Text>
                      <Text style={[styles.taraItemPeso, { color: colors.accent }]}>Peso personalizado</Text>
                    </TouchableOpacity>
                  </View>
                  {taraEspecial && (
                    <>
                      <Text style={[styles.sectionLabel, { color: colors.text + 'aa', marginTop: 12 }]}>Peso de la tara (kg)</Text>
                      <TextInput
                        style={[styles.pesoInput, { borderColor: colors.accent, color: colors.text }]}
                        placeholder="0.000"
                        placeholderTextColor="#888"
                        keyboardType="decimal-pad"
                        value={taraEspecialPeso}
                        onChangeText={t => setTaraEspecialPeso(t.replace(/[^0-9.]/g, ''))}
                      />
                    </>
                  )}
                  <Text style={[styles.sectionLabel, { color: colors.text + 'aa', marginTop: 12 }]}>Cantidad</Text>
                  <TextInput
                    style={[styles.pesoInput, { borderColor: colors.accent, color: colors.text }]}
                    placeholder="0"
                    placeholderTextColor="#888"
                    keyboardType="decimal-pad"
                    value={taraCantidad}
                    onChangeText={t => setTaraCantidad(t.replace(/[^0-9.]/g, ''))}
                  />
                  <View style={styles.stepButtons}>
                    <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.accent }]} onPress={handleTaraNo}>
                      <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>Sin tara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: colors.accent, opacity: taraItem && taraCantidad && (!taraEspecial || parseFloat(taraEspecialPeso) > 0) ? 1 : 0.5 }]}
                      onPress={handleAplicarTara}
                      disabled={!taraItem || !taraCantidad || (taraEspecial && !(parseFloat(taraEspecialPeso) > 0))}
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

        {canales.length > 0 && (
          <TouchableOpacity
            style={[styles.finalizarBtn, { backgroundColor: puedeFinalizar ? colors.accent : '#888' }]}
            onPress={puedeFinalizar ? handleFinalizar : undefined}
          >
            <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
            <Text style={styles.finalizarBtnText}>
              {puedeFinalizar ? `Finalizar Despiece (${canalesCompletados.length} canales)` : `Faltan ${canalesPendientes.length} canales por despiezar`}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {showFinalizarModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, width: isMobile ? width * 0.9 : isTablet ? 500 : 600 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Finalizar Despiece</Text>
            <Text style={[styles.modalSubtitle, { color: colors.text + '99' }]}>
              {canalesCompletados.length} de {canales.length} canales despiezados.
              {'\n'}¿Está seguro que los datos capturados son correctos?
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
  cardImage: {
    width: 260,
    height: 160,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 12,
  },
  volverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 24,
    marginBottom: 16,
  },
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
  canalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  canalCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 6,
  },
  canalCardNum: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  canalCardPeso: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
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
  taraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  taraItemCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  taraItemName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  taraItemPeso: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
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
