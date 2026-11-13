import { Redirect, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getPerfil } from '../../lib/perfil';

const ROL_ADMIN = 'administrador';

/**
 * Todo /registros es exclusivo de administradores.
 * Este guard evita el acceso por URL directa; la protección real
 * de los datos está en las políticas RLS (supabase/migrations).
 */
export default function RegistrosLayout() {
  const { colors } = useTheme();
  const [estado, setEstado] = useState<'cargando' | 'permitido' | 'denegado'>('cargando');

  useEffect(() => {
    let activo = true;
    getPerfil()
      .then(perfil => {
        if (activo) setEstado(perfil?.rol === ROL_ADMIN ? 'permitido' : 'denegado');
      })
      .catch(() => {
        if (activo) setEstado('denegado');
      });
    return () => {
      activo = false;
    };
  }, []);

  if (estado === 'cargando') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (estado === 'denegado') return <Redirect href="/" />;

  return <Slot />;
}
