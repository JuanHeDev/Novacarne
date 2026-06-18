import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, toggleTheme, colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isWeb = width >= 1024;

  const cardWidth = isWeb ? 400 : isTablet ? 380 : width * 0.85;
  const cardPadding = isWeb ? 32 : isTablet ? 28 : 24;
  const logoSize = isWeb ? 130 : isTablet ? 110 : 90;

  const handleLogin = () => {
    if (!usuario.trim() || !password.trim()) {
      Alert.alert('Campos vacíos', 'Por favor ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/');
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <TouchableOpacity
        style={[styles.themeButton, { backgroundColor: colors.accent }]}
        onPress={toggleTheme}
      >
        <MaterialCommunityIcons
          name={isDark ? 'weather-night' : 'white-balance-sunny'}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth, padding: cardPadding }]}>
        <Image
          source={require('../assets/images/NOVACARNE.png')}
          style={[styles.logo, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.22 }]}
          contentFit="contain"
        />

        <Text style={[styles.title, { color: colors.text }]}>Iniciar sesión</Text>
        <Text style={[styles.subtitle, { color: colors.text + '99' }]}>Ingresa tus credenciales</Text>

        <View style={[styles.inputContainer, { borderColor: colors.accent }]}>
          <MaterialCommunityIcons name="account" size={20} color={colors.text + '99'} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Usuario"
            placeholderTextColor={colors.text + '66'}
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputContainer, { borderColor: colors.accent }]}>
          <MaterialCommunityIcons name="lock" size={20} color={colors.text + '99'} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Contraseña"
            placeholderTextColor={colors.text + '66'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.text + '99'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <MaterialCommunityIcons name="loading" size={20} color={isDark ? colors.background : colors.card} />
          ) : (
            <MaterialCommunityIcons name="login" size={20} color={isDark ? colors.background : colors.card} />
          )}
          <Text style={[styles.loginButtonText, { color: isDark ? colors.background : colors.card }]}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  themeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  card: {
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logo: {
    borderWidth: 3,
    borderColor: '#170c79',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
