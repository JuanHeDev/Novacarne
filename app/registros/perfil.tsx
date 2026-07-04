import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';

const roles = ['Admin', 'Caja'];
const sucursales = ['Sucursal A', 'Sucursal B', 'Sucursal C'];

interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  sucursal: string;
}

export default function PerfilScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('');
  const [sucursal, setSucursal] = useState('');

  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [editPerfil, setEditPerfil] = useState<Perfil | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editSucursal, setEditSucursal] = useState('');

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerItems, setPickerItems] = useState<string[]>([]);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'rol' | 'sucursal' | 'editRol' | 'editSucursal' | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 700 : isTablet ? 600 : width * 0.92;
  const titleSize = isWeb ? 26 : isTablet ? 22 : 18;

  const handleRegistrar = () => {
    if (!nombre.trim() || !correo.trim() || !rol || !sucursal) {
      setAlertTitle('Campos incompletos');
      setAlertMessage('Todos los campos son obligatorios.');
      setAlertVisible(true);
      return;
    }

    /*
     * CONEXIÓN SUPABASE — Registrar perfil
     * 1. Crear una tabla `perfiles` en Supabase con:
     *    - id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
     *    - nombre TEXT NOT NULL
     *    - correo TEXT NOT NULL UNIQUE
     *    - rol TEXT NOT NULL
     *    - sucursal TEXT NOT NULL
     *    - created_at TIMESTAMPTZ DEFAULT now()
     *
     * 2. Reemplazar el mock de abajo con:
     *    const { error } = await supabase
     *      .from('perfiles')
     *      .insert({ id: data.user.id, nombre, correo, rol, sucursal });
     *
     *    Para obtener data.user.id, el usuario debe estar autenticado:
     *    const { data } = await supabase.auth.getUser();
     *
     *    Si el perfil ya existe (conflicto de id), mostrar mensaje.
     */

    const nuevo: Perfil = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      correo: correo.trim(),
      rol,
      sucursal,
    };
    setPerfiles([...perfiles, nuevo]);
    setNombre('');
    setCorreo('');
    setRol('');
    setSucursal('');
  };

  const handleEliminar = (id: string) => {
    /*
     * CONEXIÓN SUPABASE — Eliminar perfil
     *    const { error } = await supabase
     *      .from('perfiles')
     *      .delete()
     *      .eq('id', id);
     */
    setPerfiles(perfiles.filter(p => p.id !== id));
  };

  const openEdit = (p: Perfil) => {
    setEditPerfil(p);
    setEditNombre(p.nombre);
    setEditRol(p.rol);
    setEditSucursal(p.sucursal);
    setShowEditModal(true);
  };

  const handleGuardarEdit = () => {
    if (!editNombre.trim() || !editRol || !editSucursal || !editPerfil) return;

    /*
     * CONEXIÓN SUPABASE — Modificar perfil
     *    const { error } = await supabase
     *      .from('perfiles')
     *      .update({ nombre: editNombre.trim(), rol: editRol, sucursal: editSucursal })
     *      .eq('id', editPerfil.id);
     */

    setPerfiles(perfiles.map(p =>
      p.id === editPerfil!.id
        ? { ...p, nombre: editNombre.trim(), rol: editRol, sucursal: editSucursal }
        : p
    ));
    setShowEditModal(false);
    setEditPerfil(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ——— FORMULARIO DE REGISTRO ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Registrar Perfil</Text>

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Nombre"
            placeholderTextColor="#888"
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Correo electrónico"
            placeholderTextColor="#888"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Rol dropdown */}
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => { setPickerItems(roles); setPickerTitle('Seleccionar rol'); setPickerTarget('rol'); setPickerVisible(true); }}
          >
            <Text style={[rol ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
              {rol || 'Seleccionar rol'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Sucursal dropdown */}
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => { setPickerItems(sucursales); setPickerTitle('Seleccionar sucursal'); setPickerTarget('sucursal'); setPickerVisible(true); }}
          >
            <Text style={[sucursal ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
              {sucursal || 'Seleccionar sucursal'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRegistrar}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* ——— TABLA DE PERFILES EXISTENTES ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Perfiles existentes</Text>

          {perfiles.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              No hay perfiles registrados aún.
            </Text>
          ) : (
            perfiles.map(p => (
              <View key={p.id} style={[styles.perfilRow, { borderBottomColor: colors.accent + '33' }]}>
                <View style={styles.perfilInfo}>
                  <Text style={[styles.perfilNombre, { color: colors.text }]}>{p.nombre}</Text>
                  <Text style={[styles.perfilDetalle, { color: colors.text + '99' }]}>{p.correo} · {p.rol} · {p.sucursal}</Text>
                </View>
                <View style={styles.perfilAcciones}>
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
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { backgroundColor: colors.card, width: isMobile ? width * 0.9 : 450 }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Modificar Perfil</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Nombre"
              placeholderTextColor="#888"
              value={editNombre}
              onChangeText={setEditNombre}
            />

            {/* Edit Rol dropdown */}
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => { setPickerItems(roles); setPickerTitle('Seleccionar rol'); setPickerTarget('editRol'); setPickerVisible(true); }}
            >
              <Text style={[editRol ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                {editRol || 'Seleccionar rol'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Edit Sucursal dropdown */}
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => { setPickerItems(sucursales); setPickerTitle('Seleccionar sucursal'); setPickerTarget('editSucursal'); setPickerVisible(true); }}
            >
              <Text style={[editSucursal ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                {editSucursal || 'Seleccionar sucursal'}
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
                onPress={() => {
                  if (pickerTarget === 'rol') setRol(item);
                  else if (pickerTarget === 'sucursal') setSucursal(item);
                  else if (pickerTarget === 'editRol') setEditRol(item);
                  else if (pickerTarget === 'editSucursal') setEditSucursal(item);
                  setPickerVisible(false);
                }}
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
  perfilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
    width: '100%',
  },
  perfilInfo: {
    flex: 1,
  },
  perfilNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  perfilDetalle: {
    fontSize: 13,
    marginTop: 2,
  },
  perfilAcciones: {
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
