import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';
import { supabase } from '../../lib/supabase';
import { getPerfil } from '../../lib/perfil';

const PROVEEDOR_FIJO = 'Rastro Delta';

interface PreliminarOption {
  id: string;
  fecha_compra: string;
}

interface SucursalOption {
  id: string;
  nombre: string;
}

const getDayRange = (daysAgo: number) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysAgo);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

export default function LotesEntrada() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [notas, setNotas] = useState('');

  const [showSeleccionModal, setShowSeleccionModal] = useState(false);
  const [cargandoOpciones, setCargandoOpciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [preliminares, setPreliminares] = useState<PreliminarOption[]>([]);
  const [preliminarId, setPreliminarId] = useState<string | null>(null);
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [showSucursalDropdown, setShowSucursalDropdown] = useState(false);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const numCanales = params.numCanales ? parseInt(Array.isArray(params.numCanales) ? params.numCanales[0] : params.numCanales) : 0;
  const pesoTotal = params.pesoTotal ? parseFloat(Array.isArray(params.pesoTotal) ? params.pesoTotal[0] : params.pesoTotal) : 0;

  const pesosCanalesRaw = params.pesosCanales ? (Array.isArray(params.pesosCanales) ? params.pesosCanales[0] : params.pesosCanales) : null;
  let pesosCanales: unknown[] = [];
  if (pesosCanalesRaw) {
    try { pesosCanales = JSON.parse(pesosCanalesRaw); } catch { pesosCanales = []; }
  }

  const mostrarNumCanales = numCanales > 0 ? numCanales : '--';
  const mostrarPesoTotal = pesoTotal > 0 ? pesoTotal.toFixed(2) : '--';

  const isMobile = width < 768;
  const isWeb = width >= 1024;
  const cardWidth = isWeb ? 500 : isMobile ? width * 0.9 : 420;

  const fetchPreliminares = async () => {
    setCargandoOpciones(true);
    setPreliminares([]);
    setPreliminarId(null);

    for (let dias = 0; dias <= 1; dias++) {
      const { start, end } = getDayRange(dias);
      const { data, error } = await supabase
        .from('preliminar_lote')
        .select('id, fecha_compra')
        .is('deleted_at', null)
        .gte('fecha_compra', start)
        .lt('fecha_compra', end)
        .order('fecha_compra', { ascending: false });

      if (error) {
        console.error('Error fetching preliminar_lote:', JSON.stringify(error, null, 2));
        break;
      }

      if (data && data.length > 0) {
        setPreliminares(data);
        break;
      }
    }

    setCargandoOpciones(false);
  };

  const fetchSucursales = async () => {
    const { data, error } = await supabase
      .from('sucursales')
      .select('id, nombre')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('nombre');

    if (error) {
      console.error('Error fetching sucursales:', JSON.stringify(error, null, 2));
      return;
    }
    setSucursales(data || []);
  };

  const fetchPerfil = async () => {
    const perfil = await getPerfil();
    if (!perfil) return;

    setEsAdmin(perfil.rol === 'administrador');
    setSucursalId(perfil.sucursal_id);
  };

  useEffect(() => {
    fetchPreliminares();
    fetchSucursales();
    fetchPerfil();
  }, []);

  const handleAceptar = () => {
    setShowSeleccionModal(true);
  };

  const handleConfirmarSeleccion = async () => {
    if (!preliminarId || !sucursalId || guardando) return;

    setGuardando(true);
    const payload = {
      fecha_recepcion: new Date().toISOString(),
      cantidad_canales: numCanales,
      peso_total_lote: pesoTotal,
      proveedor: PROVEEDOR_FIJO,
      notas: notas.trim() || null,
      preliminar_lote_id: preliminarId,
      sucursal_id: sucursalId,
      pesos_canales: pesosCanales.length > 0 ? pesosCanales : null,
    };

    const { error } = await supabase
      .from('lotes_entrada')
      .insert(payload);

    setGuardando(false);

    if (error) {
      console.error('INSERT error:', JSON.stringify(error, null, 2));
      setAlertTitle('Error al registrar');
      setAlertMessage(`${error.message}${error.hint ? '\n\n' + error.hint : ''}${error.details ? '\n\n' + error.details : ''}`);
      setAlertVisible(true);
      return;
    }

    setShowSeleccionModal(false);
    router.push({ pathname: '/entradas', params: { canal: 'true' } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Header showBack />

      <View style={styles.centerWrapper}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.title, { color: colors.text }]}>Lote Entrada</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconColumn}>
              <Image
                source={require('../../assets/images/entradas/cerdo.png')}
                style={styles.pigIcon}
                contentFit="contain"
              />
            </View>

            <View style={styles.dataColumn}>
              <View style={[styles.dataItem, { borderColor: colors.accent }]}>
                <Text style={[styles.dataLabel, { color: colors.text }]}>N° Canales</Text>
                <Text style={[styles.dataValue, { color: colors.text }]}>{mostrarNumCanales}</Text>
              </View>

              <View style={[styles.dataItem, { borderColor: colors.accent }]}>
                <Text style={[styles.dataLabel, { color: colors.text }]}>Peso Total (kg)</Text>
                <Text style={[styles.dataValue, { color: colors.text }]}>{mostrarPesoTotal}</Text>
              </View>
            </View>
          </View>

          <View style={styles.notesContainer}>
            <Text style={[styles.dataLabel, { color: colors.text }]}>Notas (opcional)</Text>
            <TextInput
              style={[styles.notesInput, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Agregar notas..."
              placeholderTextColor="#888"
              value={notas}
              onChangeText={setNotas}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.acceptButton,
              { backgroundColor: colors.accent }
            ]}
            onPress={handleAceptar}
          >
            <Text style={[styles.acceptButtonText, { color: '#fff' }]}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ——— MODAL SELECCIÓN LOTE PRELIMINAR + SUCURSAL ——— */}
      <Modal visible={showSeleccionModal} transparent animationType="fade" onRequestClose={() => !guardando && setShowSeleccionModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: colors.card, width: isMobile ? width * 0.9 : 480 }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Lote preliminar</Text>
            <Text style={[modalStyles.subtitle, { color: colors.text + '99' }]}>
              Selecciona el lote de hoy (o el del día anterior si no existe)
            </Text>

            {cargandoOpciones ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 24 }} />
            ) : preliminares.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center', marginVertical: 24, fontSize: 14 }}>
                No hay lotes preliminares registrados hoy ni ayer.
              </Text>
            ) : (
              preliminares.map((p) => {
                const seleccionado = preliminarId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[modalStyles.optionItem, { borderColor: seleccionado ? colors.accent : '#888' }]}
                    onPress={() => setPreliminarId(p.id)}
                  >
                    <MaterialCommunityIcons
                      name={seleccionado ? 'radiobox-marked' : 'radiobox-blank'}
                      size={22}
                      color={seleccionado ? colors.accent : '#888'}
                    />
                    <Text style={[modalStyles.optionTitle, { color: colors.text }]}>
                      {new Date(p.fecha_compra).toLocaleDateString('es-CO')}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Sucursal</Text>
            {esAdmin ? (
              <>
                <TouchableOpacity
                  style={[styles.dropdown, { borderColor: colors.accent, zIndex: 100 }]}
                  onPress={() => setShowSucursalDropdown(!showSucursalDropdown)}
                >
                  <Text style={[styles.dropdownText, { color: sucursalId ? colors.text : '#888' }]}>
                    {sucursales.find(s => s.id === sucursalId)?.nombre || 'Seleccionar'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
                </TouchableOpacity>

                {showSucursalDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.accent, zIndex: 200 }]}>
                    {sucursales.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSucursalId(s.id);
                          setShowSucursalDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: colors.text }]}>{s.nombre}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.dropdown, styles.dropdownLocked, { borderColor: colors.accent }]}>
                <Text style={[styles.dropdownText, { color: colors.text }]}>
                  {sucursales.find(s => s.id === sucursalId)?.nombre || 'Cargando...'}
                </Text>
                <MaterialCommunityIcons name="lock" size={18} color={colors.text + '99'} />
              </View>
            )}

            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonCancel, { borderColor: colors.accent }]}
                onPress={() => setShowSeleccionModal(false)}
                disabled={guardando}
              >
                <Text style={[modalStyles.buttonText, { color: colors.accent }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonAccept, { backgroundColor: (preliminarId && sucursalId) ? colors.accent : '#888' }]}
                onPress={handleConfirmarSeleccion}
                disabled={!preliminarId || !sucursalId || guardando}
              >
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>
                  {guardando ? 'Guardando...' : 'Confirmar'}
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
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  infoRow: {
    width: '100%',
    gap: 16,
  },
  iconColumn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pigIcon: {
    width: 100,
    height: 100,
  },
  dataColumn: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dataItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notesContainer: {
    width: '100%',
    marginTop: 16,
    alignSelf: 'center',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginLeft: 0,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownLocked: {
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  acceptButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 100,
  },
  acceptButtonText: {
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
    borderRadius: 20,
    padding: 24,
    gap: 8,
    alignItems: 'center',
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 16,
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
