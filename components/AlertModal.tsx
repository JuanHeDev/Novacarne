import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type AlertTipo = 'success' | 'error' | 'info';

type AlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  tipo?: AlertTipo;
};

const tipoIcon: Record<AlertTipo, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  success: 'check-circle-outline',
  error: 'alert-circle-outline',
  info: 'information-outline',
};

export default function AlertModal({ visible, title, message, onClose, tipo = 'info' }: AlertModalProps) {
  const { colors } = useTheme();

  const tipoColor = tipo === 'success' ? '#27ae60' : tipo === 'error' ? '#e74c3c' : colors.accent;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, opacity: anim, transform: [{ scale: anim }] },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: tipoColor + '22' }]}>
            <MaterialCommunityIcons name={tipoIcon[tipo]} size={40} color={tipoColor} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text + 'cc' }]}>{message}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: tipoColor }]} onPress={onClose}>
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
