import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import AlertModal from '../../components/AlertModal';
import Header from '../../components/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Preliminar {
  id: string;
  cantidad_cerdo_en_pie: number;
  peso_total_granja: number;
  costo_unitario: number;
  peso_promedio_pie: number;
  costo_total_lote: number;
  fecha_compra: string;
}

interface LoteEntrada {
  id: string;
  fecha_recepcion: string;
  cantidad_canales: number;
  peso_total_lote: number;
  proveedor: string | null;
  notas: string | null;
  sucursal_id: string | null;
  sucursales?: { nombre: string } | null;
  pesos_canales?: { num_canal: number; peso: number }[] | null;
  capturado_por?: string | null;
}

type PesoEditable = {
  num_canal: number;
  peso: string;
};

const formatNum = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const formatFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ConsultaLotes() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [preliminares, setPreliminares] = useState<Preliminar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState<Preliminar | null>(null);

  const [entradas, setEntradas] = useState<LoteEntrada[]>([]);
  const [cargandoEntradas, setCargandoEntradas] = useState(false);

  const [canalesPorPreliminar, setCanalesPorPreliminar] = useState<Record<string, number>>({});

  const [editEntrada, setEditEntrada] = useState<LoteEntrada | null>(null);
  const [editPesos, setEditPesos] = useState<PesoEditable[]>([]);
  const [pesosOriginales, setPesosOriginales] = useState<PesoEditable[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showEditarCanales, setShowEditarCanales] = useState(false);
  const [cargandoPesos, setCargandoPesos] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [guardandoCambios, setGuardandoCambios] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isWeb = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const cardWidth = isWeb ? 700 : isTablet ? 600 : width * 0.92;

  const fetchPreliminares = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('preliminar_lote')
      .select('*')
      .is('deleted_at', null)
      .order('fecha_compra', { ascending: false });
    if (!error && data) setPreliminares(data);
    else if (error) console.error('Error fetching preliminar_lote:', JSON.stringify(error, null, 2));
    setCargando(false);
  };

  useEffect(() => {
    fetchPreliminares();
    fetchCanalesPorPreliminar();
  }, []);

  const fetchEntradas = async (preliminarId: string) => {
    setCargandoEntradas(true);
    const { data, error } = await supabase
      .from('lotes_entrada')
      .select('*, sucursales(nombre)')
      .eq('preliminar_lote_id', preliminarId)
      .order('fecha_recepcion', { ascending: false });
    if (!error && data) setEntradas(data);
    else if (error) console.error('Error fetching lotes_entrada:', JSON.stringify(error, null, 2));
    setCargandoEntradas(false);
  };

  const fetchCanalesPorPreliminar = async () => {
    const { data, error } = await supabase
      .from('lotes_entrada')
      .select('preliminar_lote_id, cantidad_canales');
    if (error) {
      console.error('Error fetching lotes_entrada (conteo):', JSON.stringify(error, null, 2));
      return;
    }
    const mapa: Record<string, number> = {};
    (data || []).forEach(le => {
      const k = le.preliminar_lote_id;
      if (k) mapa[k] = (mapa[k] || 0) + (le.cantidad_canales ?? 0);
    });
    setCanalesPorPreliminar(mapa);
  };

  const renderProgresoCanales = (capturados: number, esperados: number) => {
    const pct = esperados > 0 ? Math.min(100, Math.round((capturados / esperados) * 100)) : 0;
    const completo = esperados > 0 && capturados >= esperados;
    return (
      <View style={styles.progresoContainer}>
        <View style={styles.progresoHeader}>
          <Text style={[styles.progresoLabel, { color: colors.text + '99' }]}>Canales capturados</Text>
          <Text style={[styles.progresoValor, { color: completo ? '#4CAF50' : colors.accent }]}>
            {capturados} / {esperados}
          </Text>
        </View>
        <View style={[styles.progresoBar, { backgroundColor: colors.accent + '22' }]}>
          <View style={[styles.progresoFill, { width: `${pct}%`, backgroundColor: completo ? '#4CAF50' : colors.accent }]} />
        </View>
        {completo && (
          <View style={styles.progresoCompletoRow}>
            <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
            <Text style={[styles.progresoCompleto, { color: '#4CAF50' }]}>Lote completo</Text>
          </View>
        )}
      </View>
    );
  };

  const handleSeleccionar = (p: Preliminar) => {
    setSeleccionado(p);
    fetchEntradas(p.id);
  };

  const handleVolver = () => {
    setSeleccionado(null);
    setEntradas([]);
    fetchCanalesPorPreliminar();
  };

  const filtrarPeso = (text: string) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 1) return parts[0].slice(0, 3) + '.' + parts[1].slice(0, 2);
    return parts[0].slice(0, 3);
  };

  const openEditarCanales = async (e: LoteEntrada) => {
    setEditEntrada(e);
    setEditPesos([]);
    setEditMode(false);
    setShowEditarCanales(true);
    setCargandoPesos(true);

    const { data, error } = await supabase
      .from('lotes_entrada')
      .select('pesos_canales')
      .eq('id', e.id)
      .single();

    setCargandoPesos(false);
    if (error) {
      console.error('Error fetching pesos_canales:', JSON.stringify(error, null, 2));
      setAlertTitle('Error al cargar');
      setAlertMessage('No se pudieron cargar los canales del lote.');
      setAlertVisible(true);
      return;
    }

    const pesos = (data?.pesos_canales as { num_canal: number; peso: number }[] | null) ?? [];
    const pesosIniciales = pesos.map(p => ({ num_canal: p.num_canal, peso: String(p.peso) }));
    setEditPesos(pesosIniciales);
    setPesosOriginales(pesosIniciales);
  };

  const actualizarPeso = (numCanal: number, peso: string) => {
    setEditPesos(prev => prev.map(p => p.num_canal === numCanal ? { ...p, peso } : p));
  };

  const handleModificar = () => {
    setEditMode(true);
  };

  const handleCancelarEdicion = () => {
    setEditPesos(pesosOriginales);
    setEditMode(false);
  };

  const handleGuardarCanales = () => {
    setShowEditarCanales(false);
    setShowConfirmModal(true);
  };

  const confirmarGuardarCanales = async () => {
    if (!editEntrada || guardandoCambios) return;
    setGuardandoCambios(true);

    const pesos = editPesos
      .map(p => ({ num_canal: p.num_canal, peso: parseFloat(p.peso) }))
      .filter(p => !isNaN(p.peso) && p.peso > 0);
    const pesoTotal = pesos.reduce((sum, p) => sum + p.peso, 0);

    const { error } = await supabase
      .from('lotes_entrada')
      .update({
        pesos_canales: pesos,
        peso_total_lote: pesoTotal,
        cantidad_canales: pesos.length,
      })
      .eq('id', editEntrada.id);

    setGuardandoCambios(false);
    setShowConfirmModal(false);

    if (error) {
      console.error('UPDATE error:', JSON.stringify(error, null, 2));
      setAlertTitle('Error al modificar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setAlertTitle('Lote modificado');
    setAlertMessage('Los canales del lote fueron actualizados.');
    setAlertVisible(true);
    if (seleccionado) fetchEntradas(seleccionado.id);
    fetchCanalesPorPreliminar();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {seleccionado === null ? (
          <View style={{ width: cardWidth }}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Lotes preliminares</Text>

            {cargando ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
            ) : preliminares.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="pig" size={48} color={colors.text + '44'} />
                <Text style={{ color: '#888', textAlign: 'center', fontSize: 14, marginTop: 8 }}>
                  No hay lotes preliminares registrados.
                </Text>
              </View>
            ) : (
              preliminares.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.tarjeta, { backgroundColor: colors.card, borderColor: colors.accent + '55' }]}
                  onPress={() => handleSeleccionar(p)}
                  activeOpacity={0.75}
                >
                  <View style={styles.tarjetaHeader}>
                    <View style={[styles.fechaBadge, { backgroundColor: colors.accent + '22' }]}>
                      <Text style={[styles.fechaDia, { color: colors.accent }]}>{new Date(p.fecha_compra).getDate()}</Text>
                      <Text style={[styles.fechaMes, { color: colors.accent }]}>
                        {new Date(p.fecha_compra).toLocaleDateString('es-CO', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={[styles.tarjetaTitulo, { color: colors.text }]} numberOfLines={1}>
                        Lote preliminar
                      </Text>
                      <Text style={[styles.headerSub, { color: colors.text + '99' }]}>
                        {new Date(p.fecha_compra).toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={26} color={colors.accent} />
                  </View>

                  <View style={styles.metricasRow}>
                    <View style={[styles.metrica, { backgroundColor: colors.accent + '11' }]}>
                      <MaterialCommunityIcons name="pig" size={18} color={colors.accent} />
                      <Text style={[styles.metricaValor, { color: colors.text }]}>{p.cantidad_cerdo_en_pie.toLocaleString('en-US')}</Text>
                      <Text style={[styles.metricaLabel, { color: colors.text + '99' }]}>Cerdos</Text>
                    </View>
                    <View style={[styles.metrica, { backgroundColor: colors.accent + '11' }]}>
                      <MaterialCommunityIcons name="weight" size={18} color={colors.accent} />
                      <Text style={[styles.metricaValor, { color: colors.text }]}>{formatNum(p.peso_total_granja)} kg</Text>
                      <Text style={[styles.metricaLabel, { color: colors.text + '99' }]}>Peso granja</Text>
                    </View>
                    <View style={[styles.metrica, { backgroundColor: colors.accent + '11' }]}>
                      <MaterialCommunityIcons name="cash" size={18} color={colors.accent} />
                      <Text style={[styles.metricaValor, { color: colors.text }]}>${formatNum(p.costo_unitario)}</Text>
                      <Text style={[styles.metricaLabel, { color: colors.text + '99' }]}>Costo/kg</Text>
                    </View>
                  </View>

                  {renderProgresoCanales(canalesPorPreliminar[p.id] || 0, p.cantidad_cerdo_en_pie * 2)}

                  <View style={[styles.tarjetaFooter, { borderTopColor: colors.accent + '22' }]}>
                    <Text style={[styles.footerText, { color: colors.text + '99' }]}>
                      Peso prom. {formatNum(p.peso_promedio_pie)} kg
                    </Text>
                    <Text style={[styles.footerTotal, { color: colors.accent }]}>
                      ${formatNum(p.costo_total_lote)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={{ width: cardWidth }}>
            <TouchableOpacity style={styles.backButton} onPress={handleVolver}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.accent} />
              <Text style={[styles.backButtonText, { color: colors.accent }]}>Volver a lotes preliminares</Text>
            </TouchableOpacity>

            <View style={[styles.tarjeta, { backgroundColor: colors.card, borderColor: colors.accent + '55' }]}>
              <View style={styles.tarjetaHeader}>
                <View style={[styles.fechaBadge, { backgroundColor: colors.accent + '22' }]}>
                  <Text style={[styles.fechaDia, { color: colors.accent }]}>{new Date(seleccionado.fecha_compra).getDate()}</Text>
                  <Text style={[styles.fechaMes, { color: colors.accent }]}>
                    {new Date(seleccionado.fecha_compra).toLocaleDateString('es-CO', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={[styles.tarjetaTitulo, { color: colors.text }]} numberOfLines={1}>
                    Lotes de entrada
                  </Text>
                  <Text style={[styles.headerSub, { color: colors.text + '99' }]}>
                    {seleccionado.cantidad_cerdo_en_pie.toLocaleString('en-US')} cerdos · {formatNum(seleccionado.peso_total_granja)} kg
                  </Text>
                </View>
              </View>
              {renderProgresoCanales(
                entradas.reduce((s, e) => s + (e.cantidad_canales || 0), 0),
                seleccionado.cantidad_cerdo_en_pie * 2
              )}
            </View>

            {cargandoEntradas ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
            ) : entradas.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="inbox-arrow-down" size={48} color={colors.text + '44'} />
                <Text style={{ color: '#888', textAlign: 'center', fontSize: 14, marginTop: 8 }}>
                  Este lote preliminar no tiene lotes de entrada registrados.
                </Text>
              </View>
            ) : (
              entradas.map(e => (
                <View key={e.id} style={[styles.tarjeta, { backgroundColor: colors.card, borderColor: colors.accent + '55' }]}>
                  <View style={styles.tarjetaHeader}>
                    <View style={[styles.fechaBadge, { backgroundColor: colors.accent + '22' }]}>
                      <Text style={[styles.fechaDia, { color: colors.accent }]}>{new Date(e.fecha_recepcion).getDate()}</Text>
                      <Text style={[styles.fechaMes, { color: colors.accent }]}>
                        {new Date(e.fecha_recepcion).toLocaleDateString('es-CO', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={[styles.tarjetaTitulo, { color: colors.text }]} numberOfLines={1}>
                        {new Date(e.fecha_recepcion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.canalesBtn, { backgroundColor: colors.accent + '22' }]}
                      onPress={() => openEditarCanales(e)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="format-list-numbered" size={22} color={colors.accent} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.metricasRow}>
                    <View style={[styles.metrica, { backgroundColor: colors.accent + '11' }]}>
                      <MaterialCommunityIcons name="weight" size={18} color={colors.accent} />
                      <Text style={[styles.metricaValor, { color: colors.text }]}>{formatNum(e.peso_total_lote)} kg</Text>
                      <Text style={[styles.metricaLabel, { color: colors.text + '99' }]}>Peso lote</Text>
                    </View>
                    <View style={[styles.metrica, { backgroundColor: colors.accent + '11' }]}>
                      <MaterialCommunityIcons name="store" size={18} color={colors.accent} />
                      <Text style={[styles.metricaValorSmall, { color: colors.text }]} numberOfLines={1}>
                        {e.sucursales?.nombre || '—'}
                      </Text>
                      <Text style={[styles.metricaLabel, { color: colors.text + '99' }]}>Sucursal</Text>
                    </View>
                  </View>

                  <View style={[styles.capturaRow, { borderTopColor: colors.accent + '22' }]}>
                    <MaterialCommunityIcons name="account" size={16} color={colors.accent} />
                    <Text style={[styles.capturaText, { color: colors.text + '99' }]} numberOfLines={1}>
                      Capturado por: {e.capturado_por || '—'}
                    </Text>
                  </View>

                  {e.notas ? (
                    <View style={[styles.notasContainer, { borderTopColor: colors.accent + '22', backgroundColor: colors.accent + '0d' }]}>
                      <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.accent} />
                      <Text style={[styles.notasText, { color: colors.text + 'bb' }]} numberOfLines={2}>
                        {e.notas}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ——— MODAL EDITAR CANALES ——— */}
      <Modal visible={showEditarCanales} transparent animationType="fade" onRequestClose={() => setShowEditarCanales(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: colors.card, width: isMobile ? width * 0.92 : 480 }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Canales del lote</Text>
            <Text style={[modalStyles.subtitle, { color: colors.text + '99' }]}>
              {editEntrada
                ? `${editEntrada.proveedor || 'Sin proveedor'} · ${editEntrada.fecha_recepcion ? formatFechaHora(editEntrada.fecha_recepcion) : ''}`
                : ''}
            </Text>

            {cargandoPesos ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 24 }} />
            ) : editPesos.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center', marginVertical: 24, fontSize: 14 }}>
                Este lote no tiene captura de canales registrada.
              </Text>
            ) : (
              <>
                {!editMode && (
                  <TouchableOpacity
                    style={[styles.modificarBtn, { backgroundColor: colors.accent }]}
                    onPress={handleModificar}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                    <Text style={styles.modificarBtnText}>Modificar</Text>
                  </TouchableOpacity>
                )}

                <ScrollView style={modalStyles.lista} contentContainerStyle={modalStyles.listaContent}>
                  {editPesos.map(p => (
                    <View key={p.num_canal} style={[styles.canalRow, { borderColor: editMode ? colors.accent : '#999' }]}>
                      <Text style={[styles.canalLabel, { color: editMode ? colors.text : '#999' }]}>Canal {p.num_canal}</Text>
                      <View style={[styles.canalInputContainer, { borderColor: editMode ? colors.accent : '#bbb' }, !editMode && styles.canalInputReadonly]}>
                        <TextInput
                          style={[styles.canalInput, { color: editMode ? colors.text : '#777' }]}
                          value={p.peso}
                          onChangeText={text => editMode && actualizarPeso(p.num_canal, filtrarPeso(text))}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor="#999"
                          textAlign="center"
                          editable={editMode}
                          pointerEvents={editMode ? 'auto' : 'none'}
                        />
                        <Text style={[styles.canalUnit, { color: editMode ? colors.text + '99' : '#999' }]}>kg</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={modalStyles.buttons}>
              {editMode ? (
                <>
                  <TouchableOpacity
                    style={[modalStyles.button, modalStyles.buttonCancel, { borderColor: colors.accent }]}
                    onPress={handleCancelarEdicion}
                  >
                    <Text style={[modalStyles.buttonText, { color: colors.accent }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[modalStyles.button, modalStyles.buttonAccept, { backgroundColor: editPesos.length > 0 ? colors.accent : '#888' }]}
                    onPress={handleGuardarCanales}
                    disabled={editPesos.length === 0}
                  >
                    <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Guardar cambios</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[modalStyles.button, modalStyles.buttonAccept, { backgroundColor: colors.accent }]}
                  onPress={() => setShowEditarCanales(false)}
                >
                  <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Cerrar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ——— MODAL CONFIRMACIÓN DE MODIFICACIÓN ——— */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => !guardandoCambios && setShowConfirmModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.confirmContent, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="alert" size={44} color="#e67e22" />
            <Text style={[modalStyles.title, { color: colors.text }]}>Modificar lote</Text>
            <Text style={[modalStyles.message, { color: colors.text + 'cc' }]}>
              Esta acción modificará la información del lote ¿Estás seguro?
            </Text>
            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonCancel, { borderColor: colors.accent }]}
                onPress={() => setShowConfirmModal(false)}
                disabled={guardandoCambios}
              >
                <Text style={[modalStyles.buttonText, { color: colors.accent }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonAccept, { backgroundColor: guardandoCambios ? '#888' : colors.accent }]}
                onPress={confirmarGuardarCanales}
                disabled={guardandoCambios}
              >
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>
                  {guardandoCambios ? 'Guardando...' : 'Sí, modificar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AlertModal visible={alertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 20,
  },
  tarjeta: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    width: '100%',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fechaBadge: {
    width: 48,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fechaDia: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  fechaMes: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerInfo: {
    flex: 1,
  },
  tarjetaTitulo: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  metricasRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metrica: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  canalesBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricaValor: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  metricaValorSmall: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    maxWidth: '100%',
  },
  metricaLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progresoContainer: {
    gap: 6,
  },
  progresoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progresoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progresoValor: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progresoBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progresoFill: {
    height: '100%',
    borderRadius: 4,
  },
  progresoCompletoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progresoCompleto: {
    fontSize: 12,
    fontWeight: '700',
  },
  tarjetaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerTotal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  notasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  capturaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  capturaText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  notasText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  canalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  modificarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modificarBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  canalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  canalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    minWidth: 110,
  },
  canalInputReadonly: {
    backgroundColor: '#c8c8c8',
  },
  canalInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 8,
  },
  canalUnit: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    gap: 10,
    alignItems: 'center',
    maxHeight: '90%',
  },
  confirmContent: {
    width: '80%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  lista: {
    width: '100%',
    maxHeight: 360,
  },
  listaContent: {
    gap: 10,
    paddingVertical: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
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
    fontSize: 15,
    fontWeight: 'bold',
  },
});
