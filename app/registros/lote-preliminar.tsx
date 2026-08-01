import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';
import AlertModal from '../../components/AlertModal';
import { supabase } from '../../lib/supabase';

interface LotePreliminar {
  id: string;
  cantidad_cerdo_en_pie: number;
  peso_total_granja: number;
  costo_unitario: number;
  peso_promedio_pie: number;
  costo_total_lote: number;
  fecha_compra: string;
  deleted_at?: string | null;
}

const formatNum = (n: number, decimals = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export default function LotePreliminarScreen() {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const [cantidadCerdos, setCantidadCerdos] = useState('');
  const [pesoTotalGranja, setPesoTotalGranja] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');

  const [lotes, setLotes] = useState<LotePreliminar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarEliminados, setMostrarEliminados] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const isWeb = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const cardWidth = isWeb ? 700 : isTablet ? 600 : width * 0.92;

  useEffect(() => { fetchLotes(); }, []);

  const fetchLotes = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('preliminar_lote')
      .select('*')
      .order('fecha_compra', { ascending: false });
    if (!error && data) setLotes(data);
    else if (error) console.error('Error fetching preliminar_lote:', JSON.stringify(error, null, 2));
    setCargando(false);
  };

  const handleRegistrar = async () => {
    const cantidad = parseInt(cantidadCerdos, 10);
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

    if (cantidad <= 0) {
      setAlertTitle('Valor inválido');
      setAlertMessage('La cantidad de cerdos debe ser mayor a 0.');
      setAlertVisible(true);
      return;
    }

    if (peso <= 0) {
      setAlertTitle('Valor inválido');
      setAlertMessage('El peso total granja debe ser mayor a 0.');
      setAlertVisible(true);
      return;
    }

    if (costo <= 0) {
      setAlertTitle('Valor inválido');
      setAlertMessage('El costo unitario debe ser mayor a 0.');
      setAlertVisible(true);
      return;
    }

    const payload = {
      cantidad_cerdo_en_pie: cantidad,
      peso_total_granja: peso,
      costo_unitario: costo,
    };

    const { data, error } = await supabase
      .from('preliminar_lote')
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

    setLotes([data, ...lotes]);
    setAlertTitle('Registro exitoso');
    setAlertMessage(`Lote preliminar registrado correctamente.`);
    setAlertVisible(true);

    setCantidadCerdos('');
    setPesoTotalGranja('');
    setCostoUnitario('');
  };

  const handleEliminar = async (id: string) => {
    const { error } = await supabase
      .from('preliminar_lote')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setAlertTitle('Error al eliminar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setLotes(lotes.map(l =>
      l.id === id ? { ...l, deleted_at: new Date().toISOString() } : l
    ));
  };

  const handleRestaurar = async (id: string) => {
    const { error } = await supabase
      .from('preliminar_lote')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      setAlertTitle('Error al restaurar');
      setAlertMessage(error.message);
      setAlertVisible(true);
      return;
    }

    setLotes(lotes.map(l =>
      l.id === id ? { ...l, deleted_at: null } : l
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ——— FORMULARIO DE REGISTRO ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Lote Preliminar</Text>

          <Image source={require('../../assets/images/registros/cerdo.webp')} style={styles.cardImage} contentFit="contain" />

          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Cantidad Cerdos Pie"
            placeholderTextColor="#888"
            value={cantidadCerdos}
            onChangeText={text => setCantidadCerdos(text.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, { borderColor: colors.accent, color: colors.text }]}
            placeholder="Peso Total Granja"
            placeholderTextColor="#888"
            value={pesoTotalGranja}
            onChangeText={text => {
              const cleaned = text.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              const intPart = parts[0].slice(0, 5);
              if (parts.length > 1 && parts[1]) {
                setPesoTotalGranja(`${intPart}.${parts[1].slice(0, 2)}`);
              } else if (cleaned.includes('.')) {
                setPesoTotalGranja(`${intPart}.`);
              } else {
                setPesoTotalGranja(intPart);
              }
            }}
            keyboardType="decimal-pad"
          />
          <View style={[styles.input, styles.inputWithIcon, { borderColor: colors.accent }]}>
            <MaterialCommunityIcons name="cash" size={20} color={colors.accent} />
            <TextInput
              style={[styles.inputInner, { color: colors.text }]}
              placeholder="Costo Unitario"
              placeholderTextColor="#888"
              value={costoUnitario}
              onChangeText={text => setCostoUnitario(text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleRegistrar}>
            <MaterialCommunityIcons name="pig" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Registrar</Text>
          </TouchableOpacity>
        </View>

        {/* ——— TABLA DE LOTES EXISTENTES ——— */}
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, marginTop: 20 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Lotes existentes</Text>

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
          ) : lotes.filter(l => mostrarEliminados || !l.deleted_at).length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              {lotes.length === 0
                ? 'No hay lotes registrados aún.'
                : 'No hay lotes que coincidan con los filtros.'}
            </Text>
          ) : (
            lotes.filter(l => mostrarEliminados || !l.deleted_at).map(l => (
              <View key={l.id} style={[styles.loteRow, { borderBottomColor: colors.accent + '33', opacity: l.deleted_at ? 0.5 : 1 }]}>
                <View style={styles.loteInfo}>
                  <Text style={[styles.loteNombre, { color: colors.text }]}>
                    {l.cantidad_cerdo_en_pie.toLocaleString('en-US')} cerdos · {formatNum(l.peso_total_granja)} kg
                    {l.deleted_at ? (
                      <Text style={{ color: '#e74c3c', fontSize: 12, fontWeight: 'normal' }}> (Eliminado)</Text>
                    ) : null}
                  </Text>
                  <Text style={[styles.loteDetalle, { color: colors.text + '99' }]}>
                    ${formatNum(l.costo_unitario)} /kg · Peso prom. {formatNum(l.peso_promedio_pie)} kg
                  </Text>
                  <Text style={[styles.loteDetalle, { color: colors.text + '99' }]}>
                    Costo total: ${formatNum(l.costo_total_lote)}
                  </Text>
                </View>
                <View style={styles.loteAcciones}>
                  {l.deleted_at ? (
                    <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#27ae6022' }]} onPress={() => handleRestaurar(l.id)}>
                      <MaterialCommunityIcons name="restore" size={16} color="#27ae60" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.accionBtn, { backgroundColor: '#e74c3c22' }]} onPress={() => handleEliminar(l.id)}>
                      <MaterialCommunityIcons name="delete" size={16} color="#e74c3c" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
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
    fontSize: 22,
  },
  cardImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: 'center',
    marginBottom: 8,
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  inputInner: {
    flex: 1,
    height: '100%',
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
  loteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
    width: '100%',
  },
  loteInfo: {
    flex: 1,
  },
  loteNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  loteDetalle: {
    fontSize: 13,
    marginTop: 2,
  },
  loteAcciones: {
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
