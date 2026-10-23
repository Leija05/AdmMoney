/**
 * =====================================================================
 * ADM MONEY — CONFIGURACIÓN GLOBAL DE LA APLICACIÓN WEB
 * =====================================================================
 * 
 * Aquí puedes activar o desactivar en código los datos de prueba:
 * 
 *   USE_MOCK_DATA = true
 *     -> Activa el modo de prueba (Demo / Offline).
 *     -> Carga datos de prueba realistas para gastos, galletas, recetas,
 *        ventas diarias y analítica sin requerir backend.
 *     -> Permite registrar gastos, vender galletas y escanear tickets
 *        guardando cambios en memoria local.
 * 
 *   USE_MOCK_DATA = false
 *     -> Desactiva los datos de prueba.
 *     -> Se conecta en vivo al backend FastAPI (http://localhost:8000/api)
 *        y a la base de datos real SQLite compartida con la app móvil.
 * =====================================================================
 */

export const APP_CONFIG = {
  // 🚀 CAMBIA ESTA OPCIÓN EN CÓDIGO:
  // true  = Datos de Prueba activados (Demo)
  // false = Datos Reales activados (FastAPI + SQLite)
  USE_MOCK_DATA: true,

  // URL del servidor backend FastAPI (lee .env o usa localhost:8000 por defecto)
  API_BASE_URL: ((import.meta as any).env?.VITE_API_URL 
    ? `${String((import.meta as any).env.VITE_API_URL).replace(/\/+$/, '')}/api` 
    : 'http://localhost:8000/api'),

  // Permitir alternar el modo de prueba interactivamente desde la barra de navegación
  ALLOW_RUNTIME_TOGGLE: true,

  // Clave de almacenamiento en localStorage para recordar la selección del usuario
  STORAGE_KEY_MOCK_MODE: 'admmoney_use_mock_data',
};

/**
 * Obtiene el estado actual del modo de prueba considerando la preferencia guardada
 * o la configuración por defecto de código en APP_CONFIG.USE_MOCK_DATA.
 */
export function isMockDataEnabled(): boolean {
  if (typeof window === 'undefined') return APP_CONFIG.USE_MOCK_DATA;

  if (APP_CONFIG.ALLOW_RUNTIME_TOGGLE) {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEY_MOCK_MODE);
    if (saved !== null) {
      return saved === 'true';
    }
  }

  return APP_CONFIG.USE_MOCK_DATA;
}

/**
 * Cambia interactivamente el modo de datos (Prueba vs Real).
 */
export function setMockDataEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(APP_CONFIG.STORAGE_KEY_MOCK_MODE, String(enabled));
  }
}
