import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Order } from '../lib/types';

// Configure standard in-foreground notification behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('Notifications handler init error:', e);
}

// Track IDs notified in the current app session to prevent duplicate spam
const notifiedOrderIds = new Set<string>();

export interface UpcomingDeliveryInfo {
  order: Order;
  urgency: 'overdue' | 'today' | 'tomorrow';
  label: string;
  daysDiff: number;
}

/**
 * Normaliza y compara fechas en formato YYYY-MM-DD
 */
export function getDaysUntilDelivery(deliveryDateStr: string): number {
  if (!deliveryDateStr) return 999;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse YYYY-MM-DD
    const parts = deliveryDateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const targetDate = new Date(year, month, day, 0, 0, 0, 0);
      const diffTime = targetDate.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    }
  } catch (e) {
    console.warn('Error parsing delivery date:', e);
  }
  return 999;
}

/**
 * Filtra pedidos que están a punto de ser entregados (Atrasados, Hoy o Mañana)
 */
export function getUpcomingOrders(orders: Order[]): UpcomingDeliveryInfo[] {
  const result: UpcomingDeliveryInfo[] = [];

  for (const order of orders) {
    // Solo pedidos activos
    if (order.status === 'Completado' || order.status === 'Cancelado') {
      continue;
    }

    const days = getDaysUntilDelivery(order.delivery_date);

    if (days < 0) {
      result.push({
        order,
        urgency: 'overdue',
        label: `Entrega Vencida (${Math.abs(days)}d atrás)`,
        daysDiff: days,
      });
    } else if (days === 0) {
      result.push({
        order,
        urgency: 'today',
        label: '¡Entrega Programada para HOY!',
        daysDiff: days,
      });
    } else if (days === 1) {
      result.push({
        order,
        urgency: 'tomorrow',
        label: 'Entrega para Mañana',
        daysDiff: days,
      });
    }
  }

  // Ordenar por urgencia (vencidos primero, luego hoy, luego mañana)
  return result.sort((a, b) => a.daysDiff - b.daysDiff);
}

/**
 * Solicita permisos de notificaciones locales si es necesario
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    return granted;
  } catch (e) {
    console.warn('Error requesting notification permissions:', e);
    return false;
  }
}

/**
 * Dispara notificaciones locales si la opción está activada en ajustes
 */
export async function checkAndSendOrderDeliveryNotification(
  orders: Order[],
  remindersEnabled: boolean
): Promise<void> {
  if (!remindersEnabled) return;
  if (Platform.OS === 'web') return;

  const upcoming = getUpcomingOrders(orders);
  if (upcoming.length === 0) return;

  const hasPerm = await requestNotificationPermissions();
  if (!hasPerm) return;

  for (const item of upcoming) {
    const sessionKey = `${item.order.id}-${item.urgency}-${item.order.delivery_date}`;
    if (notifiedOrderIds.has(sessionKey)) {
      continue;
    }

    try {
      let title = 'Recordatorio de Entrega de Pedido';
      let body = '';

      if (item.urgency === 'today') {
        title = '¡Pedido para entregar HOY!';
        body = `El pedido de ${item.order.customer_name} ($${item.order.total_amount.toFixed(2)}) debe entregarse hoy.`;
      } else if (item.urgency === 'tomorrow') {
        title = 'Pedido agendado para MAÑANA';
        body = `Recuerda preparar el pedido de ${item.order.customer_name} para entregar mañana.`;
      } else {
        title = 'Pedido pendiente con entrega atrasada';
        body = `El pedido de ${item.order.customer_name} tenía fecha de entrega vencida.`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: { orderId: item.order.id, type: 'order_delivery_reminder' },
        },
        trigger: null, // Envío inmediato
      });

      notifiedOrderIds.add(sessionKey);
    } catch (err) {
      console.warn('Error scheduling notification for order:', item.order.id, err);
    }
  }
}
