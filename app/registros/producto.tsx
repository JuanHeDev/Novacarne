import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';

const categorias = ['Carnes', 'Embutidos', 'Limpieza', 'Empaque', 'Otros'];
const unidades = ['kg', 'pzas'];

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  insumo: boolean;
}

/* DATOS DE PRUEBA */
const datosPrueba: Producto[] = [
  { id: 'p1', nombre: 'Lomo de cerdo', categoria: 'Carnes', unidad: 'kg', insumo: false },
  { id: 'p2', nombre: 'Pierna', categoria: 'Carnes', unidad: 'kg', insumo: false },
  { id: 'p3', nombre: 'Costilla', categoria: 'Carnes', unidad: 'kg', insumo: false },
  { id: 'p4', nombre: 'Chorizo', categoria: 'Embutidos', unidad: 'kg', insumo: false },
  { id: 'p5', nombre: 'Longaniza', categoria: 'Embutidos', unidad: 'kg', insumo: false },
  { id: 'p6', nombre: 'Jamón', categoria: 'Embutidos', unidad: 'pzas', insumo: false },
  { id: 'p7', nombre: 'Detergente industrial', categoria: 'Limpieza', unidad: 'kg', insumo: true },
  { id: 'p8', nombre: 'Cloro', categoria: 'Limpieza', unidad: 'pzas', insumo: true },
  { id: 'p9', nombre: 'Bolsa selladora', categoria: 'Empaque', unidad: 'pzas', insumo: true },
  { id: 'p10', nombre: 'Caja de cartón', categoria: 'Empaque', unidad: 'pzas', insumo: true },
  { id: 'p11', nombre: 'Sal', categoria: 'Otros', unidad: 'kg', insumo: true },
  { id: 'p12', nombre: 'Especias', categoria: 'Otros', unidad: 'kg', insumo: true },
];

export default function ProductoScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidad, setUnidad] = useState('');
  const [insumo, setInsumo] = useState(false);

  const [productos, setProductos] = useState<Producto[]>(datosPrueba);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [editProducto, setEditProducto] = useState<Producto | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategoria, setEditCategoria] = useState('');

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerItems, setPickerItems] = useState<string[]>([]);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'categoria' | 'unidad' | 'editCategoria' | 'filtro' | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 700 : isTablet ? 600 : width * 0.92;
  const titleSize = isWeb ? 26 : isTablet ? 22 : 18;

  const productosFiltrados = filtroCategoria
    ? productos.filter(p => p.categoria === filtroCategoria)
    : productos;

  const handleRegistrar = () => {
    if (!nombre.trim() || !categoria || !unidad) {
      setAlertTitle('Campos incompletos');
      setAlertMessage('Todos los campos excepto insumo son obligatorios.');
      setAlertVisible(true);
      return;
    }

    /*
     * CONEXIÓN SUPABASE — Registrar producto
     * 1. Crear una tabla `productos` en Supabase con:
     *    - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
     *    - nombre TEXT NOT NULL
     *    - categoria TEXT NOT NULL
     *    - unidad TEXT NOT NULL
     *    - insumo BOOLEAN DEFAULT false
     *    - created_at TIMESTAMPTZ DEFAULT now()
     *
     * 2. Reemplazar el mock de abajo con:
     *    const { error } = await supabase
     *      .from('productos')
     *      .insert({ nombre: nombre.trim(), categoria, unidad, insumo });
     */

    const nuevo: Producto = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      categoria,
      unidad,
      insumo,
    };
    setProductos([...productos, nuevo]);
    setNombre('');
    setCategoria('');
    setUnidad('');
    setInsumo(false);
  };

  const handleEliminar = (id: string) => {
    /*
     * CONEXIÓN SUPABASE — Eliminar producto
     *    const { error } = await supabase
     *      .from('productos')
     *      .delete()
     *      .eq('id', id);
     */
    setProductos(productos.filter(p => p.id !== id));
  };

  const openEdit = (p: Producto) => {
    setEditProducto(p);
    setEditCategoria(p.categoria);
    setShowEditModal(true);
  };

  const handleGuardarEdit = () => {
    if (!editCategoria || !editProducto) return;

    /*
     * CONEXIÓN SUPABASE — Modificar categoría del producto
     *    const { error } = await supabase
     *      .from('productos')
     *      .update({ categoria: editCategoria })
     *      .eq('id', editProducto.id);
     */

    setProductos(productos.map(p =>
      p.id === editProducto!.id
        ? { ...p, categoria: editCategoria }
        : p
    ));
    setShowEditModal(false);
    setEditProducto(null);
  };

  const pickerSelect = (item: string) => {
    if (pickerTarget === 'categoria') setCategoria(item);
    else if (pickerTarget === 'unidad') setUnidad(item);
    else if (pickerTarget === 'editCategoria') setEditCategoria(item);
    else if (pickerTarget === 'filtro') setFiltroCategoria(item);
    setPickerVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ——— FORMULARIO DE REGISTRO ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Registrar Producto</Text>

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Nombre"
            placeholderTextColor="#888"
            value={nombre}
            onChangeText={setNombre}
          />

          {/* Categoría dropdown */}
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => { setPickerItems(categorias); setPickerTitle('Seleccionar categoría'); setPickerTarget('categoria'); setPickerVisible(true); }}
          >
            <Text style={[categoria ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
              {categoria || 'Seleccionar categoría'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Unidad dropdown */}
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => { setPickerItems(unidades); setPickerTitle('Seleccionar unidad'); setPickerTarget('unidad'); setPickerVisible(true); }}
          >
            <Text style={[unidad ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
              {unidad || 'Seleccionar unidad'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Insumo toggle */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>¿Es insumo?</Text>
            <View style={styles.switchInner}>
              <Switch
                value={insumo}
                onValueChange={setInsumo}
                trackColor={{ false: '#888', true: colors.accent }}
                thumbColor={insumo ? '#fff' : '#ccc'}
              />
              <Text style={[styles.switchValue, { color: colors.text }]}>{insumo ? 'Sí' : 'No'}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRegistrar}>
            <MaterialCommunityIcons name="package-variant-plus" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* ——— TABLA DE PRODUCTOS EXISTENTES ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Productos existentes</Text>

          {/* Filtro por categoría */}
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

          {productosFiltrados.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              No hay productos{productos.length > 0 ? ' en esta categoría' : ''}.
            </Text>
          ) : (
            productosFiltrados.map(p => (
              <View key={p.id} style={[styles.productoRow, { borderBottomColor: colors.accent + '33' }]}>
                <View style={styles.productoInfo}>
                  <Text style={[styles.productoNombre, { color: colors.text }]}>{p.nombre}</Text>
                  <Text style={[styles.productoDetalle, { color: colors.text + '99' }]}>
                    {p.categoria} · {p.unidad}{p.insumo ? ' · Insumo' : ''}
                  </Text>
                </View>
                <View style={styles.productoAcciones}>
                  <TouchableOpacity style={[styles.accionBtn, { backgroundColor: colors.accent + '22' }]} onPress={() => openEdit(p)}>
                    <MaterialCommunityIcons name="pencil" size={16} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#e74c3c22' }]} onPress={() => handleEliminar(p.id)}>
                    <MaterialCommunityIcons name="delete" size={16} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ——— MODAL DE EDICIÓN ——— */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: colors.card, width: isMobile ? width * 0.9 : 450 }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Modificar Producto</Text>
            <Text style={[modalStyles.subtitle, { color: colors.text + '99' }]}>{editProducto?.nombre}</Text>

            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => { setPickerItems(categorias); setPickerTitle('Seleccionar categoría'); setPickerTarget('editCategoria'); setPickerVisible(true); }}
            >
              <Text style={[editCategoria ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                {editCategoria || 'Seleccionar categoría'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>

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
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  productoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
    width: '100%',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  productoDetalle: {
    fontSize: 13,
    marginTop: 2,
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
    gap: 14,
    alignItems: 'center',
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
