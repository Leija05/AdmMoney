/**
 * =====================================================================
 * ADM MONEY — CONFIGURACIÓN GLOBAL DE LA APP MÓVIL
 * =====================================================================
 * 
 * 1. DATOS REALES (Sin modo demo ni datos de prueba duplicados):
 *    La app trabaja exclusivamente con la base de datos en vivo de MongoDB Atlas / FastAPI.
 * 
 * 2. MENSAJE PERSONALIZABLE DEL ESTADO DEL BACKEND:
 *    Puedes cambiar los textos de abajo en cualquier momento según tu preferencia:
 * =====================================================================
 */

export const APP_CONFIG = {
  // Datos reales en vivo directamente desde la base de datos
  USE_MOCK_DATA: false,

  // Host por defecto del backend FastAPI (lee .env EXPO_PUBLIC_API_URL o usa localhost:8000)
  DEFAULT_API_HOST: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',

  // =====================================================================
  // 💬 MENSAJE PERSONALIZABLE (Cámbialo cuando quieras):
  // =====================================================================
  BACKEND_STATUS_MESSAGE_ONLINE: 'Servidor Activo',       // 👈 Mensaje cuando el backend está conectado
  BACKEND_STATUS_MESSAGE_OFFLINE: 'Servidor Desconectado', // 👈 Mensaje cuando no hay conexión
};

export function isMobileMockDataEnabled(): boolean {
  return false;
}

export function setMobileMockDataEnabled(_enabled: boolean): void {
  // Desactivado a petición del usuario
}
