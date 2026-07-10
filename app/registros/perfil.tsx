import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';
import { supabase } from '../../lib/supabase';

const roles = ['administrador', 'cajero', 'tablajero'];

interface SucursalOption {
  id: string;
  nombre: string;
}

interface Perfil {
  id: string;
  nombre_completo: string;
  email?: string;
  rol: string;
  sucursal_id: string | null;
  sucursal_nombre?: string;
}

export default function PerfilScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [sucursales, setSucursales] = useState<SucursalOption[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [sucursalId, setSucursalId] = useState('');

  const [editPerfil, setEditPerfil] = useState<Perfil | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editSucursalId, setEditSucursalId] = useState('');

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerItems, setPickerItems] = useState<string[]>([]);
  const [pickerValues, setPickerValues] = useState<string[]>([]);
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

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setCargando(true);

    const { data: sucData, error: sucError } = await supabase
      .from('sucursales')
      .select('id, nombre')
      .is('deleted_at', null)
      .eq('is_active', true);
    if (sucError) {
      setAlertTitle('Error al cargar sucursales');
      setAlertMessage(sucError.message);
      setAlertVisible(true);
    }
    const sucs = sucData || [];
    setSucursales(sucs);

    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, rol, sucursal_id')
      .order('nombre_completo', { ascending: true });
    if (error) {
      setAlertTitle('Error al cargar perfiles');
      setAlertMessage(`${error.message}\n\nCódigo: ${error.code || 'N/A'}\nDetalle: ${error.details || 'N/A'}`);
      setAlertVisible(true);
    } else if (data) {
      setPerfiles(data.map(p => ({
        ...p,
        sucursal_nombre: sucs.find(s => s.id === p.sucursal_id)?.nombre || '',
      })));
    }
    setCargando(false);
  };

  const openEdit = (p: Perfil) => {
    setEditPerfil(p);
    setEditNombre(p.nombre_completo || '');
    setEditRol(p.rol || '');
    setEditSucursalId(p.sucursal_id || '');
    setShowEditModal(true);
  };

  const handleGuardarEdit = async () => {
    if (!editNombre.trim() || !editRol || !editPerfil) return;

    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre_completo: editNombre.trim(),
        rol: editRol,
        sucursal_id: editSucursalId || null,
      })
      .eq('id', editPerfil.id);

    if (error) {
      setAlertTitle('Error al modificar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setPerfiles(perfiles.map(p =>
      p.id === editPerfil!.id
        ? { ...p, nombre_completo: editNombre.trim(), rol: editRol, sucursal_id: editSucursalId || null, sucursal_nombre: sucursales.find(s => s.id === editSucursalId)?.nombre || '' }
        : p
    ));
    setShowEditModal(false);
    setEditPerfil(null);
  };

  const handleRegistrar = async () => {
    if (!nombre.trim() || !rol) return;

    const { error } = await supabase
      .from('perfiles')
      .insert({
        nombre_completo: nombre.trim(),
        rol,
        sucursal_id: sucursalId || null,
      });

    if (error) {
      setAlertTitle('Error al registrar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setNombre('');
    setRol('');
    setSucursalId('');
    init();
  };

  const pickerSelect = (label: string) => {
    if (pickerTarget === 'rol') setRol(label);
    else if (pickerTarget === 'sucursal') setSucursalId(pickerValues[pickerItems.indexOf(label)] || '');
    else if (pickerTarget === 'editRol') setEditRol(label);
    else if (pickerTarget === 'editSucursal') setEditSucursalId(pickerValues[pickerItems.indexOf(label)] || '');
    setPickerVisible(false);
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
            placeholder="Nombre completo"
            placeholderTextColor="#888"
            value={nombre}
            onChangeText={setNombre}
          />

          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => { setPickerItems(roles); setPickerTitle('Seleccionar rol'); setPickerTarget('rol'); setPickerVisible(true); }}
          >
            <View style={styles.dropdownLeft}>
              <MaterialCommunityIcons name="badge-account" size={20} color={colors.accent} />
              <Text style={[rol ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                {rol || 'Rol'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => {
              setPickerItems(sucursales.map(s => s.nombre));
              setPickerValues(sucursales.map(s => s.id));
              setPickerTitle('Seleccionar sucursal');
              setPickerTarget('sucursal');
              setPickerVisible(true);
            }}
          >
            <View style={styles.dropdownLeft}>
              <MaterialCommunityIcons name="store" size={20} color={colors.accent} />
              <Text style={[sucursalId ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                {sucursales.find(s => s.id === sucursalId)?.nombre || 'Sucursal'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRegistrar}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* ——— TABLA DE PERFILES ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Perfiles existentes</Text>

          {cargando ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
          ) : perfiles.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              No hay perfiles registrados aún.
            </Text>
          ) : (
            perfiles.map(p => (
              <View key={p.id} style={[styles.perfilRow, { borderBottomColor: colors.accent + '33' }]}>
                <View style={styles.perfilInfo}>
                  <Text style={[styles.perfilNombre, { color: colors.text }]}>{p.nombre_completo}</Text>
                  <Text style={[styles.perfilDetalle, { color: colors.text + '99' }]}>
                    {p.rol || 'Sin rol'} · {p.sucursal_nombre || 'Sin sucursal'}
                  </Text>
                </View>
                <View style={styles.perfilAcciones}>
                  <TouchableOpacity style={[styles.accionBtn, { backgroundColor: colors.accent + '22' }]} onPress={() => openEdit(p)}>
                    <MaterialCommunityIcons name="pencil" size={16} color={colors.accent} />
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
            <Text style={[modalStyles.title, { color: colors.text }]}>Modificar Perfil</Text>
            <Text style={[modalStyles.subtitle, { color: colors.text + '99' }]}>{editPerfil?.nombre_completo}</Text>

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Nombre completo</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Nombre completo"
              placeholderTextColor="#888"
              value={editNombre}
              onChangeText={setEditNombre}
            />

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Rol</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => { setPickerItems(roles); setPickerTitle('Seleccionar rol'); setPickerTarget('editRol'); setPickerVisible(true); }}
            >
              <View style={styles.dropdownLeft}>
                <MaterialCommunityIcons name="badge-account" size={20} color={colors.accent} />
                <Text style={[editRol ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                  {editRol || 'Rol'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={[modalStyles.fieldLabel, { color: colors.text }]}>Sucursal</Text>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => {
                setPickerItems(sucursales.map(s => s.nombre));
                setPickerValues(sucursales.map(s => s.id));
                setPickerTitle('Seleccionar sucursal');
                setPickerTarget('editSucursal');
                setPickerVisible(true);
              }}
            >
              <View style={styles.dropdownLeft}>
                <MaterialCommunityIcons name="store" size={20} color={colors.accent} />
                <Text style={[editSucursalId ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                  {sucursales.find(s => s.id === editSucursalId)?.nombre || 'Sucursal'}
                </Text>
              </View>
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
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
