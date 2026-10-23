/**
 * =====================================================================
 * ADM MONEY — CONFIGURACIÓN GLOBAL DE LA APP MÓVIL
 * =====================================================================
 * 
 * Aquí puedes activar o desactivar en código los datos de prueba:
 * 
 *   USE_MOCK_DATA = true
 *     -> Activa el modo de prueba (Demo / Offline).
 *     -> Carga datos de prueba realistas para gastos, galletas, recetas,
 *        ventas diarias y analítica sin requerir backend.
 *     -> Te permite probar la app en tu teléfono, emulador o navegador web
 *        de forma 100% interactiva e inmediata.
 * 
 *   USE_MOCK_DATA = false
 *     -> Desactiva los datos de prueba.
 *     -> Se conecta en vivo al backend FastAPI en la red local
 *        compartiendo la base de datos SQLite con la página web.
 * =====================================================================
 */

export const APP_CONFIG = {
  // 🚀 CAMBIA ESTA OPCIÓN EN CÓDIGO:
  // true  = Datos de Prueba activados (Demo / In-Memory)
  // false = Datos Reales activados (FastAPI + SQLite en vivo)
  USE_MOCK_DATA: true,

  // Host por defecto del backend FastAPI (lee .env EXPO_PUBLIC_API_URL o usa localhost:8000)
  DEFAULT_API_HOST: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',

  // Permitir alternar interactivamente desde la pestaña de Ajustes
  ALLOW_RUNTIME_TOGGLE: true,
};

let runtimeMockDataEnabled = APP_CONFIG.USE_MOCK_DATA;

export function isMobileMockDataEnabled(): boolean {
  return runtimeMockDataEnabled;
}

export function setMobileMockDataEnabled(enabled: boolean): void {
  runtimeMockDataEnabled = enabled;
}
