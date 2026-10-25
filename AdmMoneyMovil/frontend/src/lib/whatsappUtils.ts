/**
 * Utilidades para formatear números de teléfono y generar enlaces directos a WhatsApp
 */

export const cleanPhoneForWhatsApp = (rawPhone: string): string => {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/\D/g, '');
  if (!cleaned) return '';
  
  // Si el usuario ingresa un número mexicano estándar de 10 dígitos, añadir prefijo 52
  if (cleaned.length === 10) {
    cleaned = '52' + cleaned;
  }
  return cleaned;
};

export const formatDisplayPhone = (rawPhone: string): string => {
  if (!rawPhone) return 'No configurado';
  const cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+52 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('52')) {
    const num = cleaned.slice(2);
    return `+52 (${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
  }
  return rawPhone;
};

export const buildWhatsAppLink = (rawPhone: string, text: string = ''): string => {
  const cleanPhone = cleanPhoneForWhatsApp(rawPhone);
  if (!cleanPhone) return '';
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${cleanPhone}${query}`;
};
