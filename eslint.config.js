// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Las pantallas cargan datos al montar (setCargando(true) dentro del fetch).
      // Patrón válido; se deja como aviso hasta migrar a un hook de datos.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
