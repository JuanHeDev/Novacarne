import AsyncStorage from '@react-native-async-storage/async-storage';

export async function cargarEstado<T>(clave: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function guardarEstado(clave: string, valor: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // noop
  }
}

export async function limpiarEstado(clave: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(clave);
  } catch {
    // noop
  }
}
