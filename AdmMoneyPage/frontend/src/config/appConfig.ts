/**
 * =====================================================================
 * ADM MONEY — CONFIGURACIÓN GLOBAL DE LA APLICACIÓN WEB
 * =====================================================================
 * 
 * 1. DATOS REALES (Sin modo demo ni datos de prueba duplicados):
 *    La aplicación web trabaja exclusivamente con la base de datos en vivo de MongoDB Atlas / FastAPI.
 * 
 * 2. MENSAJE PERSONALIZABLE DEL ESTADO DEL BACKEND:
 *    Puedes cambiar los textos de abajo en cualquier momento según tu preferencia:
 * =====================================================================
 */

export const APP_CONFIG = {
  // Datos reales en vivo directamente desde MongoDB Atlas
  USE_MOCK_DATA: false,

  // URL del servidor backend FastAPI (lee .env VITE_API_URL o usa localhost:8000 por defecto)
  API_BASE_URL: ((import.meta as any).env?.VITE_API_URL
    ? `${String((import.meta as any).env.VITE_API_URL).replace(/\/+$/, '')}/api`
    : 'http://localhost:8000/api'),

  // Desactivado a petición del usuario: trabajar exclusivamente con base de datos real
  ALLOW_RUNTIME_TOGGLE: false,

  // =====================================================================
  // 💬 MENSAJE PERSONALIZABLE (Cámbialo cuando quieras):
  // =====================================================================
  BACKEND_STATUS_MESSAGE_ONLINE: 'Servidor Activo',       // 👈 Mensaje cuando el backend está conectado
  BACKEND_STATUS_MESSAGE_OFFLINE: 'Servidor Desconectado', // 👈 Mensaje cuando no hay conexión
};

/**
 * Obtiene el estado actual: siempre false (datos reales en vivo).
 */
export function isMockDataEnabled(): boolean {
  return false;
}

/**
 * Función sin efecto ya que el modo demo ha sido desactivado permanentemente.
 */
export function setMockDataEnabled(_enabled: boolean): void {
  // Desactivado: solo datos reales
}
