import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';
import { supabase } from '../../lib/supabase';

interface Sucursal {
  id: string;
  nombre: string;
  dirección: string;
  telefono: string;
  is_active: boolean;
  deleted_at?: string | null;
}

export default function SucursalScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarEliminados, setMostrarEliminados] = useState(false);
  const [editSucursal, setEditSucursal] = useState<Sucursal | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDireccion, setEditDireccion] = useState('');
  const [editTelefono, setEditTelefono] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 700 : isTablet ? 600 : width * 0.92;
  const titleSize = isWeb ? 26 : isTablet ? 22 : 18;

  useEffect(() => { fetchSucursales(); }, []);

  const fetchSucursales = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('sucursales')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setSucursales(data);
    else if (error) console.error('Error fetching sucursales:', JSON.stringify(error, null, 2));
    setCargando(false);
  };

  const handleRegistrar = async () => {
    if (!nombre.trim() || !direccion.trim() || !telefono.trim()) {
      setAlertTitle('Campos incompletos');
      setAlertMessage('Todos los campos son obligatorios.');
      setAlertVisible(true);
      return;
    }

    const payload = { nombre: nombre.trim(), dirección: direccion.trim(), telefono: telefono.trim(), is_active: true };
    console.log('INSERT payload:', JSON.stringify(payload));

    const { data, error } = await supabase
      .from('sucursales')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('INSERT error:', JSON.stringify(error, null, 2));
      setAlertTitle('Error al registrar');
      setAlertMessage(`${error.message}${error.hint ? '\n\n' + error.hint : ''}${error.details ? '\n\n' + error.details : ''}`);
      setAlertVisible(true);
      return;
    }

    setSucursales([data, ...sucursales]);
    setNombre('');
    setDireccion('');
    setTelefono('');
  };

  const handleToggleActivo = async (id: string) => {
    const suc = sucursales.find(s => s.id === id);
    if (!suc) return;

    const { error } = await supabase
      .from('sucursales')
      .update({ is_active: !suc.is_active })
      .eq('id', id);

    if (error) {
      setAlertTitle('Error al cambiar estado');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setSucursales(sucursales.map(s =>
      s.id === id ? { ...s, is_active: !s.is_active } : s
    ));
  };

  const handleEliminar = async (id: string) => {
    const { error } = await supabase
      .from('sucursales')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setAlertTitle('Error al eliminar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setSucursales(sucursales.map(s =>
      s.id === id ? { ...s, deleted_at: new Date().toISOString() } : s
    ));
  };

  const handleRestaurar = async (id: string) => {
    const { error } = await supabase
      .from('sucursales')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      setAlertTitle('Error al restaurar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setSucursales(sucursales.map(s =>
      s.id === id ? { ...s, deleted_at: null } : s
    ));
  };

  const openEdit = (s: Sucursal) => {
    setEditSucursal(s);
    setEditDireccion(s.dirección);
    setEditTelefono(s.telefono);
    setShowEditModal(true);
  };

  const handleGuardarEdit = async () => {
    if (!editDireccion.trim() || !editTelefono.trim() || !editSucursal) return;

    const { error } = await supabase
      .from('sucursales')
      .update({ dirección: editDireccion.trim(), telefono: editTelefono.trim() })
      .eq('id', editSucursal.id);

    if (error) {
      setAlertTitle('Error al modificar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setSucursales(sucursales.map(s =>
      s.id === editSucursal!.id
        ? { ...s, dirección: editDireccion.trim(), telefono: editTelefono.trim() }
        : s
    ));
    setShowEditModal(false);
    setEditSucursal(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ——— FORMULARIO DE REGISTRO ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Registrar Sucursal</Text>

          <Image source={require('../../assets/images/registros/sucursal.avif')} style={styles.cardImage} contentFit="contain" />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Nombre"
            placeholderTextColor="#888"
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Dirección"
            placeholderTextColor="#888"
            value={direccion}
            onChangeText={setDireccion}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Teléfono"
            placeholderTextColor="#888"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRegistrar}>
            <MaterialCommunityIcons name="store-plus" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* ——— TABLA DE SUCURSALES EXISTENTES ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Sucursales existentes</Text>

          <View style={styles.filtroRow}>
            <Text style={[styles.filtroLabel, { color: colors.text }]}>Mostrar eliminados</Text>
            <Switch
              value={mostrarEliminados}
              onValueChange={setMostrarEliminados}
              trackColor={{ false: '#888', true: colors.accent }}
              thumbColor={mostrarEliminados ? '#fff' : '#ccc'}
            />
          </View>

          {cargando ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
          ) : sucursales.filter(s => mostrarEliminados || !s.deleted_at).length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              {sucursales.length === 0
                ? 'No hay sucursales registradas aún.'
                : 'No hay sucursales que coincidan con los filtros.'}
            </Text>
          ) : (
            sucursales.filter(s => mostrarEliminados || !s.deleted_at).map(s => (
              <View key={s.id} style={[styles.sucursalRow, { borderBottomColor: colors.accent + '33', opacity: s.deleted_at ? 0.5 : 1 }]}>
                <View style={styles.sucursalInfo}>
                  <Text style={[styles.sucursalNombre, { color: colors.text }]}>
                    {s.nombre}
                    {s.deleted_at ? (
                      <Text style={{ color: '#e74c3c', fontSize: 12, fontWeight: 'normal' }}> (Eliminado)</Text>
                    ) : null}
                  </Text>
                  <Text style={[styles.sucursalDetalle, { color: colors.text + '99' }]}>{s.dirección} · {s.telefono}</Text>
                </View>
                <View style={styles.sucursalAcciones}>
                  {s.deleted_at ? (
                    <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#27ae6022' }]} onPress={() => handleRestaurar(s.id)}>
                      <MaterialCommunityIcons name="restore" size={16} color="#27ae60" />
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.activoBtn, { backgroundColor: s.is_active ? '#2ecc7122' : '#e74c3c22' }]}
                        onPress={() => handleToggleActivo(s.id)}
                      >
                        <MaterialCommunityIcons
                          name={s.is_active ? 'check-circle' : 'close-circle'}
                          size={18}
                          color={s.is_active ? '#2ecc71' : '#e74c3c'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.accionBtn, { backgroundColor: colors.accent + '22' }]} onPress={() => openEdit(s)}>
                        <MaterialCommunityIcons name="pencil" size={16} color={colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#e74c3c22' }]} onPress={() => handleEliminar(s.id)}>
                        <MaterialCommunityIcons name="delete" size={16} color="#e74c3c" />
                      </TouchableOpacity>
                    </>
                  )}
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
            <Text style={[modalStyles.title, { color: colors.text }]}>Modificar Sucursal</Text>
            <Text style={[modalStyles.subtitle, { color: colors.text + '99' }]}>{editSucursal?.nombre}</Text>

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Dirección</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Dirección"
              placeholderTextColor="#888"
              value={editDireccion}
              onChangeText={setEditDireccion}
            />
            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Teléfono</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Teléfono"
              placeholderTextColor="#888"
              value={editTelefono}
              onChangeText={setEditTelefono}
              keyboardType="phone-pad"
            />

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
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#170c79',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
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
  sucursalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
    width: '100%',
  },
  sucursalInfo: {
    flex: 1,
  },
  sucursalNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  sucursalDetalle: {
    fontSize: 13,
    marginTop: 2,
  },
  sucursalAcciones: {
    flexDirection: 'row',
    gap: 8,
  },
  activoBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  filtroLabel: {
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
});
