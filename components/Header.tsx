import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AlertModal from './AlertModal';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function Header({ showBack, onBackPress }: HeaderProps) {
  const router = useRouter();
  const { isDark, toggleTheme, colors } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [userName, setUserName] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('perfiles').select('nombre_completo').eq('id', user.id).single();
      setUserName(data?.nombre_completo || user.email?.split('@')[0] || '');
    });
  }, []);

  return (
    <View style={[showBack ? styles.header : styles.headerAbsolute]}>
      {showBack && (
        <TouchableOpacity
          onPress={onBackPress || (() => router.back())}
          style={[styles.backButton, { backgroundColor: colors.accent }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={[styles.headerRight, !showBack && { marginLeft: 'auto' }]}>
        {showBack && (
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.accent }]} onPress={() => router.replace('/')}>
            <MaterialCommunityIcons name="home" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.accent }]} onPress={toggleTheme}>
          <MaterialCommunityIcons name={isDark ? 'weather-night' : 'white-balance-sunny'} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.accent }]} onPress={() => setShowMenu(!showMenu)}>
          <MaterialCommunityIcons name="account" size={24} color="#fff" />
        </TouchableOpacity>
        {showMenu && (
          <View style={[styles.menu, { backgroundColor: colors.card }]}>
            <View style={styles.profileSection}>
              <MaterialCommunityIcons name="account-circle" size={32} color={colors.accent} />
              <Text style={[styles.profileEmail, { color: colors.text }]}>{userName}</Text>
            </View>
            <View style={[styles.menuDivider, { backgroundColor: colors.text + '22' }]} />
            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              setShowMenu(false);
              const { error } = await supabase.auth.signOut();
              if (error) { setAlertTitle('Error'); setAlertMessage(error.message); setAlertVisible(true); }
            }}>
              <MaterialCommunityIcons name="logout" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <AlertModal visible={alertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerAbsolute: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 0,
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
    elevation: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
