import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import AlertModal from '../../components/AlertModal';
import Header from '../../components/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ProveedorScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [categoria, setCategoria] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTipo, setAlertTipo] = useState<'success' | 'error' | 'info'>('info');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 500 : isTablet ? 450 : width * 0.9;
  const titleSize = isWeb ? 26 : isTablet ? 22 : 18;

  const handleRegistrar = async () => {
    if (!nombreEmpresa.trim()) {
      setAlertTipo('error');
      setAlertTitle('Campos incompletos');
      setAlertMessage('El nombre de la empresa es obligatorio.');
      setAlertVisible(true);
      return;
    }

    const payload = {
      nombre_empresa: nombreEmpresa.trim(),
      contacto_nombre: contactoNombre.trim() || null,
      rfc: rfc.trim().toUpperCase() || null,
      telefono: telefono.trim() || null,
      categoria: categoria.trim() || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('proveedores')
      .insert(payload);

    if (error) {
      console.error('INSERT error:', JSON.stringify(error, null, 2));
      setAlertTipo('error');
      setAlertTitle('Error al registrar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setNombreEmpresa('');
    setContactoNombre('');
    setRfc('');
    setTelefono('');
    setCategoria('');

    setAlertTipo('success');
    setAlertTitle('Registrado');
    setAlertMessage('Proveedor registrado correctamente.');
    setAlertVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Registrar Proveedor</Text>

          <MaterialCommunityIcons name="truck-delivery" size={64} color={colors.accent} style={styles.cardIcon} />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Nombre de la empresa"
            placeholderTextColor="#888"
            value={nombreEmpresa}
            onChangeText={setNombreEmpresa}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Nombre de contacto"
            placeholderTextColor="#888"
            value={contactoNombre}
            onChangeText={setContactoNombre}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="RFC"
            placeholderTextColor="#888"
            value={rfc}
            onChangeText={text => setRfc(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            autoCapitalize="characters"
          />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Teléfono"
            placeholderTextColor="#888"
            value={telefono}
            onChangeText={text => setTelefono(text.replace(/[^0-9+() -]/g, ''))}
            keyboardType="phone-pad"
          />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Categoría"
            placeholderTextColor="#888"
            value={categoria}
            onChangeText={setCategoria}
          />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRegistrar}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AlertModal visible={alertVisible} title={alertTitle} message={alertMessage} tipo={alertTipo} onClose={() => setAlertVisible(false)} />
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
