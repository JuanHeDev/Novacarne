import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import AlertModal from '../../components/AlertModal';
import Header from '../../components/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

const categorias = ['Carnes', 'Embutidos', 'Limpieza', 'Empaque', 'Otros'];
const unidades = ['kg', 'pzas'];

function generarCode128(): string {
  const prefijo = '28';
  const timestamp = Date.now().toString().slice(-8);
  const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
  const base = prefijo + timestamp + aleatorio;
  const checksum = base.split('').reduce((s, c, i) => s + parseInt(c, 10) * (i + 1), 0) % 103;
  return base + checksum.toString().padStart(2, '0');
}

export default function ProductoScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidad, setUnidad] = useState('');
  const [insumo, setInsumo] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerItems, setPickerItems] = useState<string[]>([]);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'categoria' | 'unidad' | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 500 : isTablet ? 450 : width * 0.9;
  const titleSize = isWeb ? 26 : isTablet ? 22 : 18;

  const handleRegistrar = async () => {
    if (!nombre.trim() || !categoria || !unidad) {
      setAlertTitle('Campos incompletos');
      setAlertMessage('Todos los campos son obligatorios.');
      setAlertVisible(true);
      return;
    }

    const payload = {
      codigo_barras: generarCode128(),
      nombre: nombre.trim(),
      categoria,
      unidad_medida: unidad,
      precio_venta: 0,
      es_insumo: insumo,
    };

    const { error } = await supabase
      .from('productos')
      .insert(payload);

    if (error) {
      setAlertTitle('Error al registrar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setNombre('');
    setCategoria('');
    setUnidad('');
    setInsumo(false);

    setAlertTitle('Registrado');
    setAlertMessage('Producto registrado correctamente.');
    setAlertVisible(true);
  };

  const pickerSelect = (item: string) => {
    if (pickerTarget === 'categoria') setCategoria(item);
    else if (pickerTarget === 'unidad') setUnidad(item);
    setPickerVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Registrar Producto</Text>

          <MaterialCommunityIcons name="package-variant" size={64} color={colors.accent} style={styles.cardIcon} />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Nombre"
            placeholderTextColor="#888"
            value={nombre}
            onChangeText={setNombre}
          />

          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => { setPickerItems(categorias); setPickerTitle('Seleccionar categoría'); setPickerTarget('categoria'); setPickerVisible(true); }}
          >
            <View style={styles.dropdownLeft}>
              <MaterialCommunityIcons name="tag-text-outline" size={20} color={colors.accent} />
              <Text style={[categoria ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                {categoria || 'Categoría'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdown, { borderColor: colors.accent }]}
            onPress={() => { setPickerItems(unidades); setPickerTitle('Seleccionar unidad'); setPickerTarget('unidad'); setPickerVisible(true); }}
          >
            <View style={styles.dropdownLeft}>
              <MaterialCommunityIcons name="scale-balance" size={20} color={colors.accent} />
              <Text style={[unidad ? { color: colors.text } : { color: '#888' }, { fontSize: 15 }]}>
                {unidad || 'Unidad'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

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
      </ScrollView>

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
    justifyContent: 'center',
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
    alignSelf: 'center',
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
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
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
