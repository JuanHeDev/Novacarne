import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';

const proveedores = [
  { id: 1, nombre: 'Proveedor A' },
  { id: 2, nombre: 'Proveedor B' },
  { id: 3, nombre: 'Proveedor C' },
];

export default function LotesEntrada() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string | null>(null);
  const [notas, setNotas] = useState('');

  const numCanales = params.numCanales ? parseInt(Array.isArray(params.numCanales) ? params.numCanales[0] : params.numCanales) : 0;
  const pesoTotal = params.pesoTotal ? parseFloat(Array.isArray(params.pesoTotal) ? params.pesoTotal[0] : params.pesoTotal) : 0;
  
  const mostrarNumCanales = numCanales > 0 ? numCanales : '--';
  const mostrarPesoTotal = pesoTotal > 0 ? pesoTotal.toFixed(2) : '--';

  const isMobile = width < 768;
  const isWeb = width >= 1024;
  const cardWidth = isWeb ? 500 : isMobile ? width * 0.9 : 420;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Header showBack />

      <View style={styles.centerWrapper}>
      <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
        <Text style={[styles.title, { color: colors.text }]}>Lote Entrada</Text>

        <View style={styles.infoRow}>
          <View style={styles.iconColumn}>
            <Image
              source={require('../../assets/images/entradas/cerdo.png')}
              style={styles.pigIcon}
              contentFit="contain"
            />
          </View>

          <View style={styles.dataColumn}>
            <View style={[styles.dataItem, { borderColor: colors.accent }]}>
              <Text style={[styles.dataLabel, { color: colors.text }]}>N° Canales</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{mostrarNumCanales}</Text>
            </View>

            <View style={[styles.dataItem, { borderColor: colors.accent }]}>
              <Text style={[styles.dataLabel, { color: colors.text }]}>Peso Total (kg)</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{mostrarPesoTotal}</Text>
            </View>
          </View>
        </View>

        <View style={styles.providerNotesRow}>
          <View style={[styles.providerColumn, { position: 'relative', flex: 1 }]}>
            <Text style={[styles.dataLabel, { color: colors.text }]}>Proveedor</Text>
            <TouchableOpacity 
              style={[styles.dropdown, { borderColor: colors.accent }]}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={[styles.dropdownText, { color: proveedorSeleccionado ? colors.text : '#888' }]}>
                {proveedorSeleccionado || 'Seleccionar'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
            
            {showDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                {proveedores.map((prov) => (
                  <TouchableOpacity
                    key={prov.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setProveedorSeleccionado(prov.nombre);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{prov.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.notesColumn}>
            <Text style={[styles.dataLabel, { color: colors.text }]}>Notas (opcional)</Text>
            <TextInput
              style={[styles.notesInput, { borderColor: colors.accent, color: colors.text }]}
              placeholder="Agregar notas..."
              placeholderTextColor="#888"
              value={notas}
              onChangeText={setNotas}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.acceptButton, 
            { backgroundColor: proveedorSeleccionado ? colors.accent : '#888' }
          ]}
          onPress={() => proveedorSeleccionado && router.push({ pathname: '/entradas', params: { canal: 'true' } })}
          disabled={!proveedorSeleccionado}
        >
          <Text style={[styles.acceptButtonText, { color: '#fff' }]}>Aceptar</Text>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  infoRow: {
    width: '100%',
    gap: 16,
  },
  iconColumn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pigIcon: {
    width: 100,
    height: 100,
  },
  dataColumn: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dataItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  providerNotesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  providerColumn: {
    position: 'relative',
    width: '45%',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginLeft: 0,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  notesColumn: {
    width: '55%',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  acceptButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 100,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});