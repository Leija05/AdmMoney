import { useAppStore } from '../stores/app.store';

// ==============================================================================
// 1. PALETA DE COLORES CLARA (Pasteles suaves sobre lienzo porcelana)
// ==============================================================================
export const lightColors = {
  // Lienzo & Superficies
  bgPrimary: '#F8F9FB',        // Soft porcelain canvas
  bgSecondary: '#FFFFFF',      // Crisp pure white card
  bgTertiary: '#F1F3F7',       // Soft neutral shelf & pill
  bgCard: '#FFFFFF',           // Card surface
  bgSurface: '#F8F9FA',        // Sub-surface
  bgModal: '#FFFFFF',          // Modal dialog surface

  // Tipografía
  textMain: '#181A1F',         // Charcoal headline & body
  textMuted: '#5E6472',        // Balanced slate
  textDim: '#8B92A2',          // Subtle caption

  // Marca Principal: Azul Cielo Pastel
  brand: '#0284C7',
  brandLight: '#38BDF8',
  brandDark: '#0369A1',
  brandBg: '#E0F2FE',
  brandText: '#0369A1',
  brandBorder: '#BAE6FD',
  brandGlow: 'rgba(2, 132, 199, 0.15)',

  // Pastel Miel / Ámbar (Galletas & Ventas)
  amber: '#D97706',
  amberLight: '#F59E0B',
  amberBg: '#FEF3C7',
  amberText: '#92400E',
  amberBorder: '#FDE68A',
  caramel: '#D97706',
  caramelLight: '#F59E0B',

  // Pastel Menta / Salvia (Utilidad limpia)
  emerald: '#16A34A',
  emeraldLight: '#22C55E',
  emeraldBg: '#DCFCE7',
  emeraldText: '#15803D',
  emeraldBorder: '#BBF7D0',
  sage: '#16A34A',
  sageLight: '#22C55E',

  // Pastel Rosa / Rubor (Gastos & Costos)
  rose: '#E11D48',
  roseLight: '#F43F5E',
  roseBg: '#FFE4E6',
  roseText: '#BE123C',
  roseBorder: '#FECDD3',
  rust: '#E11D48',
  rustLight: '#F43F5E',

  // Pastel Lavanda & Cyan
  purple: '#7C3AED',
  purpleLight: '#8B5CF6',
  purpleBg: '#EDE9FE',
  purpleText: '#6D28D9',
  purpleBorder: '#DDD6FE',
  cyan: '#0284C7',
  cyanLight: '#06B6D4',
  cyanBg: '#CFFAFE',

  // WhatsApp Pastel
  whatsapp: '#047857',
  whatsappBg: '#D1FAE5',
  whatsappText: '#047857',

  // Bordes & Separadores
  borderSubtle: '#E5E7EB',
  borderHighlight: '#D1D5DB',
  borderFocus: '#0284C7',
};

// ==============================================================================
// 2. PALETA DE COLORES OSCURA ("Medio Apagado" - Cálido, pizarra suave, no OLED)
// ==============================================================================
export const darkColors: typeof lightColors = {
  // Lienzo & Superficies
  bgPrimary: '#14171F',        // Pizarra profunda, suave y descansada
  bgSecondary: '#1C202A',      // Superficie de tarjetas
  bgTertiary: '#242936',       // Contenedores elevados y pastillas
  bgCard: '#1C202A',           // Tarjetas
  bgSurface: '#242936',        // Sub-superficie de listas
  bgModal: '#1C202A',          // Modales

  // Tipografía
  textMain: '#F1F3F7',         // Blanco cálido y descansado
  textMuted: '#9BA3AF',        // Gris pizarra secundario
  textDim: '#64748B',          // Texto sutil

  // Marca Principal: Azul Cielo Pastel Luminoso
  brand: '#38BDF8',
  brandLight: '#7DD3FC',
  brandDark: '#0284C7',
  brandBg: 'rgba(56, 189, 248, 0.15)',
  brandText: '#7DD3FC',
  brandBorder: 'rgba(56, 189, 248, 0.28)',
  brandGlow: 'rgba(56, 189, 248, 0.22)',

  // Pastel Miel / Ámbar Cálido
  amber: '#F59E0B',
  amberLight: '#FBBF24',
  amberBg: 'rgba(245, 158, 11, 0.16)',
  amberText: '#FDE047',
  amberBorder: 'rgba(245, 158, 11, 0.28)',
  caramel: '#F59E0B',
  caramelLight: '#FBBF24',

  // Pastel Menta / Esmeralda
  emerald: '#22C55E',
  emeraldLight: '#4ADE80',
  emeraldBg: 'rgba(34, 197, 94, 0.16)',
  emeraldText: '#6EE7B7',
  emeraldBorder: 'rgba(34, 197, 94, 0.28)',
  sage: '#22C55E',
  sageLight: '#4ADE80',

  // Pastel Rosa / Rubor Suave
  rose: '#F43F5E',
  roseLight: '#FB7185',
  roseBg: 'rgba(244, 63, 94, 0.16)',
  roseText: '#FDA4AF',
  roseBorder: 'rgba(244, 63, 94, 0.28)',
  rust: '#F43F5E',
  rustLight: '#FB7185',

  // Pastel Lavanda & Cyan
  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleBg: 'rgba(168, 85, 247, 0.16)',
  purpleText: '#D8B4FE',
  purpleBorder: 'rgba(168, 85, 247, 0.28)',
  cyan: '#38BDF8',
  cyanLight: '#67E8F9',
  cyanBg: 'rgba(56, 189, 248, 0.16)',

  // WhatsApp Pastel
  whatsapp: '#10B981',
  whatsappBg: 'rgba(16, 185, 129, 0.16)',
  whatsappText: '#6EE7B7',

  // Bordes Maquinados Suaves
  borderSubtle: '#2A303C',
  borderHighlight: '#3B4353',
  borderFocus: '#38BDF8',
};

// ==============================================================================
// 3. GRADIENTES CALIBRADOS (Pasteles luminosos y de alta gama)
// ==============================================================================
export const gradients = {
  // Brand Gradients
  brand: ['#0284C7', '#0369A1'] as const,
  skyGlow: ['#38BDF8', '#0284C7'] as const,
  skySoft: ['#E0F2FE', '#BAE6FD'] as const,

  // Bakery Warm Gold / Amber Honey
  amber: ['#F59E0B', '#D97706'] as const,
  amberGlow: ['#FBBF24', '#D97706'] as const,
  amberSoft: ['#FEF3C7', '#FDE68A'] as const,

  // Mint / Sage Profit
  emerald: ['#16A34A', '#15803D'] as const,
  emeraldGlow: ['#22C55E', '#16A34A'] as const,
  mintSoft: ['#DCFCE7', '#BBF7D0'] as const,

  // Rose / Blush Expenses
  rose: ['#E11D48', '#BE123C'] as const,
  roseGlow: ['#F43F5E', '#E11D48'] as const,
  roseSoft: ['#FFE4E6', '#FECDD3'] as const,

  // Purple / Lavender
  purple: ['#7C3AED', '#6D28D9'] as const,
  purpleGlow: ['#8B5CF6', '#7C3AED'] as const,
  purpleSoft: ['#EDE9FE', '#DDD6FE'] as const,

  // Hero Card Adaptive Gradients
  heroLight: ['#0284C7', '#0369A1', '#075985'] as const,
  heroDark: ['#1E2536', '#161C28', '#10131B'] as const,
  heroPositive: ['#059669', '#047857', '#064E3B'] as const,
  heroNegative: ['#E11D48', '#BE123C', '#9F1239'] as const,

  // Surface Glass Gradients
  cardGlassLight: ['#FFFFFF', '#FBFBFC'] as const,
  cardGlassDark: ['#1C202A', '#161922'] as const,
};

// ==============================================================================
// 4. HOOK & PROXY REACTIVO PARA ACCESO TRANSPARENTE
// ==============================================================================
export const useThemeColors = () => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const palette = isDark ? darkColors : lightColors;

  return {
    ...palette,
    isDark,
    heroGradient: isDark
      ? (['#1E2536', '#161C28', '#10131B'] as [string, string, string])
      : (['#0284C7', '#0369A1', '#075985'] as [string, string, string]),
    cardGradient: isDark
      ? (['#1C202A', '#161922'] as [string, string])
      : (['#FFFFFF', '#FBFBFC'] as [string, string]),
    surfaceGradient: isDark
      ? (['#242936', '#1E232F'] as [string, string])
      : (['#F8F9FA', '#F1F3F7'] as [string, string]),
  };
};

export const colors = new Proxy({} as typeof lightColors, {
  get(_target, prop: keyof typeof lightColors) {
    try {
      const activeTheme = useAppStore.getState?.()?.theme || 'light';
      const palette = activeTheme === 'dark' ? darkColors : lightColors;
      return palette[prop] ?? lightColors[prop];
    } catch {
      return lightColors[prop];
    }
  },
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  outer: 16,
  inner: 12,
  pill: 9999,
};
