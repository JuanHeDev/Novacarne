import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';

interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
}

export default function SucursalScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
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

  const handleRegistrar = () => {
    if (!nombre.trim() || !direccion.trim() || !telefono.trim()) {
      setAlertTitle('Campos incompletos');
      setAlertMessage('Todos los campos son obligatorios.');
      setAlertVisible(true);
      return;
    }

    /*
     * CONEXIÓN SUPABASE — Registrar sucursal
     * 1. Crear una tabla `sucursales` en Supabase con:
     *    - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
     *    - nombre TEXT NOT NULL
     *    - direccion TEXT NOT NULL
     *    - telefono TEXT NOT NULL
     *    - activo BOOLEAN DEFAULT true
     *    - created_at TIMESTAMPTZ DEFAULT now()
     *
     * 2. Reemplazar el mock de abajo con:
     *    const { error } = await supabase
     *      .from('sucursales')
     *      .insert({ nombre: nombre.trim(), direccion: direccion.trim(), telefono: telefono.trim(), activo: true });
     */

    const nueva: Sucursal = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      activo: true,
    };
    setSucursales([...sucursales, nueva]);
    setNombre('');
    setDireccion('');
    setTelefono('');
  };

  const handleToggleActivo = (id: string) => {
    /*
     * CONEXIÓN SUPABASE — Activar/desactivar sucursal
     *    const suc = sucursales.find(s => s.id === id);
     *    const { error } = await supabase
     *      .from('sucursales')
     *      .update({ activo: !suc?.activo })
     *      .eq('id', id);
     */
    setSucursales(sucursales.map(s =>
      s.id === id ? { ...s, activo: !s.activo } : s
    ));
  };

  const handleEliminar = (id: string) => {
    /*
     * CONEXIÓN SUPABASE — Eliminar sucursal
     *    const { error } = await supabase
     *      .from('sucursales')
     *      .delete()
     *      .eq('id', id);
     */
    setSucursales(sucursales.filter(s => s.id !== id));
  };

  const openEdit = (s: Sucursal) => {
    setEditSucursal(s);
    setEditDireccion(s.direccion);
    setEditTelefono(s.telefono);
    setShowEditModal(true);
  };

  const handleGuardarEdit = () => {
    if (!editDireccion.trim() || !editTelefono.trim() || !editSucursal) return;

    /*
     * CONEXIÓN SUPABASE — Modificar sucursal
     *    const { error } = await supabase
     *      .from('sucursales')
     *      .update({ direccion: editDireccion.trim(), telefono: editTelefono.trim() })
     *      .eq('id', editSucursal.id);
     */

    setSucursales(sucursales.map(s =>
      s.id === editSucursal!.id
        ? { ...s, direccion: editDireccion.trim(), telefono: editTelefono.trim() }
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

          {sucursales.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              No hay sucursales registradas aún.
            </Text>
          ) : (
            sucursales.map(s => (
              <View key={s.id} style={[styles.sucursalRow, { borderBottomColor: colors.accent + '33' }]}>
                <View style={styles.sucursalInfo}>
                  <Text style={[styles.sucursalNombre, { color: colors.text }]}>{s.nombre}</Text>
                  <Text style={[styles.sucursalDetalle, { color: colors.text + '99' }]}>{s.direccion} · {s.telefono}</Text>
                </View>
                <View style={styles.sucursalAcciones}>
                  <TouchableOpacity
                    style={[styles.activoBtn, { backgroundColor: s.activo ? '#2ecc7122' : '#e74c3c22' }]}
                    onPress={() => handleToggleActivo(s.id)}
                  >
                    <MaterialCommunityIcons
                      name={s.activo ? 'check-circle' : 'close-circle'}
                      size={18}
                      color={s.activo ? '#2ecc71' : '#e74c3c'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.accionBtn, { backgroundColor: colors.accent + '22' }]} onPress={() => openEdit(s)}>
                    <MaterialCommunityIcons name="pencil" size={16} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#e74c3c22' }]} onPress={() => handleEliminar(s.id)}>
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
            <Text style={[modalStyles.title, { color: colors.text }]}>Modificar Sucursal</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Dirección"
              placeholderTextColor="#888"
              value={editDireccion}
              onChangeText={setEditDireccion}
            />
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
});
