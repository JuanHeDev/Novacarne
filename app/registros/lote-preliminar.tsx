import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';
import { supabase } from '../../lib/supabase';

export default function LotePreliminarScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [cantidadCerdos, setCantidadCerdos] = useState('');
  const [pesoTotalGranja, setPesoTotalGranja] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isWeb = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const cardWidth = isWeb ? 500 : isTablet ? 450 : width * 0.92;

  const handleRegistrar = async () => {
    const cantidad = parseFloat(cantidadCerdos);
    const peso = parseFloat(pesoTotalGranja);
    const costo = parseFloat(costoUnitario);

    if (!cantidadCerdos.trim() || !pesoTotalGranja.trim() || !costoUnitario.trim()) {
      setAlertTitle('Campos incompletos');
      setAlertMessage('Todos los campos son obligatorios.');
      setAlertVisible(true);
      return;
    }

    if (isNaN(cantidad) || isNaN(peso) || isNaN(costo)) {
      setAlertTitle('Valores inválidos');
      setAlertMessage('Ingresa valores numéricos válidos.');
      setAlertVisible(true);
      return;
    }

    const payload = {
      cantidad_cerdos_pie: cantidad,
      peso_total_granja: peso,
      costo_unitario: costo,
    };

    const { data, error } = await supabase
      .from('lote_preliminar')
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

    setAlertTitle('Registro exitoso');
    setAlertMessage(`Lote preliminar registrado correctamente.`);
    setAlertVisible(true);

    setCantidadCerdos('');
    setPesoTotalGranja('');
    setCostoUnitario('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Lote Preliminar</Text>

          <Image source={require('../../assets/images/registros/cerdo.webp')} style={styles.cardImage} contentFit="contain" />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Cantidad Cerdos Pie"
            placeholderTextColor="#888"
            value={cantidadCerdos}
            onChangeText={setCantidadCerdos}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Peso Total Granja"
            placeholderTextColor="#888"
            value={pesoTotalGranja}
            onChangeText={setPesoTotalGranja}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Costo Unitario"
            placeholderTextColor="#888"
            value={costoUnitario}
            onChangeText={setCostoUnitario}
            keyboardType="numeric"
          />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRegistrar}>
            <MaterialCommunityIcons name="pig" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    fontSize: 20,
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
});
