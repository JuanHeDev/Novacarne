import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark, toggleTheme, colors } = useTheme();
  
  const [showPassword, setShowPassword] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const isMobile = width < 768;
  const cardWidth = isMobile ? width * 0.85 : 380;

  const handleLogin = () => {
    // Aquí-iría la lógica de autenticación
    router.replace('/index');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
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

      <View style={[styles.card, { backgroundColor: colors.card, width: cardWidth }]}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>Bienvenido</Text>

        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/NOVACARNE.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>

        <View style={[styles.inputContainer, { borderColor: colors.accent }]}>
          <MaterialCommunityIcons name="account" size={20} color="#666" />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Usuario"
            placeholderTextColor="#888"
            value={usuario}
            onChangeText={setUsuario}
          />
        </View>

        <View style={[styles.inputContainer, { borderColor: colors.accent }]}>
          <MaterialCommunityIcons name="lock" size={20} color="#666" />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, { backgroundColor: colors.accent }]}
          onPress={handleLogin}
        >
          <Text style={[styles.loginButtonText, { color: isDark ? colors.background : colors.card }]}>Iniciar sesión</Text>
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
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#170c79',
    marginBottom: 24,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
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
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});