import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/Header';

export default function Consultas() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 500 : isTablet ? 450 : width * 0.9;
  const buttonIconSize = isWeb ? 48 : isTablet ? 40 : 36;
  const titleSize = isWeb ? 28 : isTablet ? 24 : 20;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <Header showBack />

      <View style={styles.centerWrapper}>
        <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: titleSize }]}>Consultas</Text>

          <TouchableOpacity style={[styles.optionButton, { borderColor: colors.accent }]} onPress={() => router.push('/consultas/producto')}>
            <MaterialCommunityIcons name="package-variant" size={buttonIconSize} color={colors.accent} />
            <Text style={[styles.optionText, { color: colors.text }]}>Productos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionButton, { borderColor: colors.accent }]} onPress={() => router.push('/consultas/lotes')}>
            <MaterialCommunityIcons name="pig" size={buttonIconSize} color={colors.accent} />
            <Text style={[styles.optionText, { color: colors.text }]}>Lotes</Text>
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
    padding: 32,
    alignItems: 'center',
    alignSelf: 'center',
    gap: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    gap: 16,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
