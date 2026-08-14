import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import AlertModal from '../../components/AlertModal';
import Header from '../../components/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

const categorias = ['Carnes', 'Embutidos', 'Limpieza', 'Empaque', 'Otros'];
const unidades = ['kg', 'pzas'];

const formatNum = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  unidad_medida: string;
  es_insumo: boolean;
  precio_venta: number;
  deleted_at?: string | null;
}

export default function ConsultaProductos() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [mostrarEliminados, setMostrarEliminados] = useState(false);

  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const [editProducto, setEditProducto] = useState<Producto | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategoria, setEditCategoria] = useState('');
  const [editUnidad, setEditUnidad] = useState('');
  const [editPrecioVenta, setEditPrecioVenta] = useState('');
  const [editInsumo, setEditInsumo] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerItems, setPickerItems] = useState<string[]>([]);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'editCategoria' | 'editUnidad' | 'filtro' | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 700 : isTablet ? 600 : width * 0.92;
  const titleSize = isWeb ? 26 : isTablet ? 22 : 18;

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setProductos(data);
    } else if (error) {
      console.error('Error fetching productos:', JSON.stringify(error, null, 2));
    }
    setCargando(false);
  };

  const productosVisibles = productos.filter(p => {
    if (filtroCategoria && p.categoria !== filtroCategoria) return false;
    if (!mostrarEliminados && p.deleted_at) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(productosVisibles.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const productosPagina = productosVisibles.slice((paginaSegura - 1) * porPagina, paginaSegura * porPagina);

  const handleEliminar = async (id: string) => {
    const { error } = await supabase
      .from('productos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setAlertTitle('Error al eliminar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setProductos(productos.map(p =>
      p.id === id ? { ...p, deleted_at: new Date().toISOString() } : p
    ));
  };

  const handleRestaurar = async (id: string) => {
    const { error } = await supabase
      .from('productos')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      setAlertTitle('Error al restaurar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setProductos(productos.map(p =>
      p.id === id ? { ...p, deleted_at: null } : p
    ));
  };

  const openEdit = (p: Producto) => {
    setEditProducto(p);
    setEditCategoria(p.categoria);
    setEditUnidad(p.unidad_medida);
    setEditPrecioVenta(String(p.precio_venta));
    setEditInsumo(p.es_insumo);
    setShowEditModal(true);
  };

  const handleGuardarEdit = async () => {
    if (!editCategoria || !editUnidad || !editProducto) return;

    const { error } = await supabase
      .from('productos')
      .update({
        categoria: editCategoria,
        unidad_medida: editUnidad,
        precio_venta: parseFloat(editPrecioVenta) || 0,
        es_insumo: editInsumo,
      })
      .eq('id', editProducto.id);

    if (error) {
      setAlertTitle('Error al modificar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setProductos(productos.map(p =>
      p.id === editProducto!.id
        ? { ...p, categoria: editCategoria, unidad_medida: editUnidad, precio_venta: parseFloat(editPrecioVenta) || 0, es_insumo: editInsumo }
        : p
    ));
    setShowEditModal(false);
    setEditProducto(null);
  };

  const pickerSelect = (item: string) => {
    if (pickerTarget === 'editCategoria') setEditCategoria(item);
    else if (pickerTarget === 'editUnidad') setEditUnidad(item);
    else if (pickerTarget === 'filtro') {
      setFiltroCategoria(item);
      setPagina(1);
    }
    setPickerVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Productos existentes</Text>

          <Image source={require('../../assets/images/consultas/producto.png')} style={styles.cardIcon} contentFit="contain" />

          <View style={styles.filtroRow}>
            <Text style={[styles.filtroLabel, { color: colors.text }]}>Filtrar:</Text>
            <TouchableOpacity
              style={[styles.filtroDropdown, { borderColor: colors.accent }]}
              onPress={() => { setPickerItems(categorias); setPickerTitle('Filtrar por categoría'); setPickerTarget('filtro'); setPickerVisible(true); }}
            >
              <Text style={[filtroCategoria ? { color: colors.text } : { color: '#888' }, { fontSize: 14 }]}>
                {filtroCategoria || 'Todas las categorías'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={colors.text} />
            </TouchableOpacity>
            {filtroCategoria !== '' && (
              <TouchableOpacity onPress={() => setFiltroCategoria('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filtroRow}>
            <Text style={[styles.filtroLabel, { color: colors.text }]}>Mostrar eliminados</Text>
            <Switch
              value={mostrarEliminados}
              onValueChange={v => { setMostrarEliminados(v); setPagina(1); }}
              trackColor={{ false: '#888', true: colors.accent }}
              thumbColor={mostrarEliminados ? '#fff' : '#ccc'}
            />
          </View>

          {cargando ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
          ) : productosVisibles.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              {productos.length === 0
                ? 'No hay productos registrados.'
                : 'No hay productos que coincidan con los filtros.'}
            </Text>
          ) : (
            <>
              {productosPagina.map(p => (
                <View key={p.id} style={[styles.productoCard, { backgroundColor: colors.card + '66', borderColor: p.deleted_at ? '#e74c3c44' : colors.accent + '44', opacity: p.deleted_at ? 0.6 : 1 }]}>
                  <View style={styles.productoCardHeader}>
                    <View style={styles.productoInfo}>
                      <Text style={[styles.productoNombre, { color: colors.text }]} numberOfLines={1}>
                        {p.nombre}
                      </Text>
                      <View style={styles.badges}>
                        <View style={[styles.badge, { backgroundColor: colors.accent + '22' }]}>
                          <MaterialCommunityIcons name="tag-text-outline" size={13} color={colors.accent} />
                          <Text style={[styles.badgeText, { color: colors.accent }]}>{p.categoria}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.accent + '22' }]}>
                          <MaterialCommunityIcons name="scale-balance" size={13} color={colors.accent} />
                          <Text style={[styles.badgeText, { color: colors.accent }]}>{p.unidad_medida}</Text>
                        </View>
                        {p.es_insumo && (
                          <View style={[styles.badge, { backgroundColor: '#27ae6022' }]}>
                            <MaterialCommunityIcons name="archive" size={13} color="#27ae60" />
                            <Text style={[styles.badgeText, { color: '#27ae60' }]}>Insumo</Text>
                          </View>
                        )}
                        {p.deleted_at && (
                          <View style={[styles.badge, { backgroundColor: '#e74c3c22' }]}>
                            <MaterialCommunityIcons name="alert-circle" size={13} color="#e74c3c" />
                            <Text style={[styles.badgeText, { color: '#e74c3c' }]}>Eliminado</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.productoAcciones}>
                      {p.deleted_at ? (
                        <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#27ae6022' }]} onPress={() => handleRestaurar(p.id)}>
                          <MaterialCommunityIcons name="restore" size={18} color="#27ae60" />
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity style={[styles.accionBtn, { backgroundColor: colors.accent + '22' }]} onPress={() => openEdit(p)}>
                            <MaterialCommunityIcons name="pencil" size={18} color={colors.accent} />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#e74c3c22' }]} onPress={() => handleEliminar(p.id)}>
                            <MaterialCommunityIcons name="delete" size={18} color="#e74c3c" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={[styles.productoCardFooter, { borderTopColor: colors.accent + '22' }]}>
                    <View>
                      <Text style={[styles.precioLabel, { color: colors.text + '99' }]}>Precio de venta</Text>
                      <Text style={[styles.precioValor, { color: colors.accent }]}>${formatNum(p.precio_venta)}</Text>
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.paginador}>
                <TouchableOpacity
                  style={[styles.paginadorBtn, { borderColor: colors.accent + '44' }]}
                  disabled={paginaSegura <= 1}
                  onPress={() => setPagina(paginaSegura - 1)}
                >
                  <MaterialCommunityIcons name="chevron-left" size={20} color={paginaSegura <= 1 ? '#888' : colors.accent} />
                  <Text style={[styles.paginadorText, { color: paginaSegura <= 1 ? '#888' : colors.accent }]}>Anterior</Text>
                </TouchableOpacity>
                <Text style={[styles.paginadorInfo, { color: colors.text }]}>
                  Página {paginaSegura} de {totalPaginas}
                </Text>
                <TouchableOpacity
                  style={[styles.paginadorBtn, { borderColor: colors.accent + '44' }]}
                  disabled={paginaSegura >= totalPaginas}
                  onPress={() => setPagina(paginaSegura + 1)}
                >
                  <Text style={[styles.paginadorText, { color: paginaSegura >= totalPaginas ? '#888' : colors.accent }]}>Siguiente</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={paginaSegura >= totalPaginas ? '#888' : colors.accent} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ——— MODAL DE EDICIÓN ——— */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: colors.card, width: isMobile ? width * 0.9 : 450 }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Modificar Producto</Text>
            <Text style={[modalStyles.subtitle, { color: colors.text + '99' }]}>{editProducto?.nombre}</Text>

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Categoría</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => { setPickerItems(categorias); setPickerTitle('Seleccionar categoría'); setPickerTarget('editCategoria'); setPickerVisible(true); }}
            >
              <View style={styles.dropdownLeft}>
                <MaterialCommunityIcons name="tag-text-outline" size={20} color={colors.accent} />
                <Text style={[editCategoria ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                  {editCategoria || 'Categoría'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Unidad de medida</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => { setPickerItems(unidades); setPickerTitle('Seleccionar unidad'); setPickerTarget('editUnidad'); setPickerVisible(true); }}
            >
              <View style={styles.dropdownLeft}>
                <MaterialCommunityIcons name="scale-balance" size={20} color={colors.accent} />
                <Text style={[editUnidad ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                  {editUnidad || 'Unidad'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Precio de venta</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Precio de venta"
              placeholderTextColor="#888"
              value={editPrecioVenta}
              onChangeText={setEditPrecioVenta}
              keyboardType="decimal-pad"
            />

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>¿Es insumo?</Text>
              <View style={styles.switchInner}>
                <Switch
                  value={editInsumo}
                  onValueChange={setEditInsumo}
                  trackColor={{ false: '#888', true: colors.accent }}
                  thumbColor={editInsumo ? '#fff' : '#ccc'}
                />
                <Text style={[styles.switchValue, { color: colors.text }]}>{editInsumo ? 'Sí' : 'No'}</Text>
              </View>
            </View>

            <View style={modalStyles.buttons}>
              <TouchableOpacity style={[modalStyles.button, modalStyles.buttonCancel, { borderColor: colors.accent }]} onPress={() => setShowEditModal(false)}>
                <Text style={[modalStyles.buttonText, { color: colors.accent }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.button, modalStyles.buttonAccept, { backgroundColor: colors.accent }]} onPress={handleGuardarEdit}>
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ——— PICKER MODAL ——— */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.pickerContent, { backgroundColor: colors.card, width: isMobile ? width * 0.8 : 350 }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>{pickerTitle}</Text>
            {pickerItems.map(item => (
              <TouchableOpacity
                key={item}
                style={[modalStyles.pickerItem, { borderBottomColor: colors.accent + '22' }]}
                onPress={() => pickerSelect(item)}
              >
                <Text style={[modalStyles.pickerItemText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[modalStyles.pickerCancel, { borderTopColor: colors.accent + '22' }]} onPress={() => setPickerVisible(false)}>
              <Text style={[modalStyles.pickerCancelText, { color: colors.accent }]}>Cancelar</Text>
            </TouchableOpacity>
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
  card: {
    borderRadius: 20,
    padding: 24,
    alignSelf: 'center',
    gap: 14,
  },
  cardTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardIcon: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: 4,
    borderRadius: 12,
  },
  dropdown: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  switchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
  },
  filtroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 8,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtroDropdown: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productoCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  productoCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productoCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  precioLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  precioValor: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productoAcciones: {
    flexDirection: 'row',
    gap: 8,
  },
  accionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  paginadorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  paginadorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginadorInfo: {
    fontSize: 14,
    fontWeight: '600',
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
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: 4,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContent: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 17,
    fontWeight: '500',
  },
  pickerCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 8,
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
