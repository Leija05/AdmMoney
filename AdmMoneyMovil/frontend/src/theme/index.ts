import { useAppStore } from '../stores/app.store';

// ==============================================================================
// 1. PALETA DE COLORES CLARA (Porcelana Cálida & Zafiro Real de Alta Gama)
// ==============================================================================
export const lightColors = {
  // Lienzo & Superficies
  bgPrimary: '#F6F8FA',        // Alabastro suave, descansado y elegante
  bgSecondary: '#FFFFFF',      // Tarjeta blanca pura con relieve
  bgTertiary: '#EEF2F6',       // Pastillas, inputs y contenedores suaves
  bgCard: '#FFFFFF',           // Tarjeta principal
  bgSurface: '#F8FAFC',        // Sub-superficie de listas
  bgModal: '#FFFFFF',          // Modal blanco inmaculado

  // Tipografía
  textMain: '#0F172A',         // Carbón pizarra profundo y nítido
  textMuted: '#475569',        // Grafito equilibrado
  textDim: '#828F9E',          // Subtítulo sutil

  // Marca Principal: Zafiro Real / Azul Cielo Eléctrico
  brand: '#0284C7',
  brandLight: '#0EA5E9',
  brandDark: '#0369A1',
  brandBg: '#E0F2FE',
  brandText: '#0369A1',
  brandBorder: '#BAE6FD',
  brandGlow: 'rgba(2, 132, 199, 0.16)',

  // Pastel Miel / Ámbar Cálido (Galletas & Ventas)
  amber: '#D97706',
  amberLight: '#F59E0B',
  amberBg: '#FEF3C7',
  amberText: '#92400E',
  amberBorder: '#FDE68A',
  caramel: '#D97706',
  caramelLight: '#F59E0B',

  // Menta / Esmeralda Jade (Ganancias & Utilidad limpia)
  emerald: '#059669',
  emeraldLight: '#10B981',
  emeraldBg: '#D1FAE5',
  emeraldText: '#065F46',
  emeraldBorder: '#A7F3D0',
  sage: '#059669',
  sageLight: '#10B981',

  // Rubor Frambuesa / Rosa Gastos
  rose: '#E11D48',
  roseLight: '#F43F5E',
  roseBg: '#FFE4E6',
  roseText: '#9F1239',
  roseBorder: '#FECDD3',
  rust: '#E11D48',
  rustLight: '#F43F5E',

  // Lavanda / Violeta & Cyan
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

  // Bordes & Separadores Suaves
  borderSubtle: '#E2E8F0',
  borderHighlight: '#CBD5E1',
  borderFocus: '#0284C7',
};

// ==============================================================================
// 2. PALETA DE COLORES OSCURA (Obsidiana Profunda, Pizarra & Aurora Neón)
// ==============================================================================
export const darkColors: typeof lightColors = {
  // Lienzo & Superficies
  bgPrimary: '#0A0D14',        // Obsidiana profunda con tinte azul espacial
  bgSecondary: '#121620',      // Tarjetas elevadas de alta gama
  bgTertiary: '#1A202E',       // Contenedores interactivos y pastillas
  bgCard: '#121620',           // Superficie de tarjetas
  bgSurface: '#161B28',        // Sub-superficie de listas
  bgModal: '#121620',          // Modales oscuros premium

  // Tipografía
  textMain: '#F8FAFC',         // Blanco titanio de máxima legibilidad
  textMuted: '#94A3B8',        // Pizarra claro secundario
  textDim: '#64748B',          // Texto tenue y pies de foto

  // Marca Principal: Azul Cielo Eléctrico Luminoso
  brand: '#0EA5E9',
  brandLight: '#38BDF8',
  brandDark: '#0284C7',
  brandBg: 'rgba(14, 165, 233, 0.16)',
  brandText: '#38BDF8',
  brandBorder: 'rgba(56, 189, 248, 0.32)',
  brandGlow: 'rgba(56, 189, 248, 0.25)',

  // Ámbar / Miel Dorado Cálido
  amber: '#F59E0B',
  amberLight: '#FBBF24',
  amberBg: 'rgba(245, 158, 11, 0.18)',
  amberText: '#FDE047',
  amberBorder: 'rgba(245, 158, 11, 0.32)',
  caramel: '#F59E0B',
  caramelLight: '#FBBF24',

  // Menta / Esmeralda Aurora
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldBg: 'rgba(16, 185, 129, 0.18)',
  emeraldText: '#6EE7B7',
  emeraldBorder: 'rgba(16, 185, 129, 0.32)',
  sage: '#10B981',
  sageLight: '#34D399',

  // Rubor / Carmesí Neón Suave
  rose: '#F43F5E',
  roseLight: '#FB7185',
  roseBg: 'rgba(244, 63, 94, 0.18)',
  roseText: '#FDA4AF',
  roseBorder: 'rgba(244, 63, 94, 0.32)',
  rust: '#F43F5E',
  rustLight: '#FB7185',

  // Lavanda Neón & Cyan
  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleBg: 'rgba(168, 85, 247, 0.18)',
  purpleText: '#D8B4FE',
  purpleBorder: 'rgba(168, 85, 247, 0.32)',
  cyan: '#06B6D4',
  cyanLight: '#67E8F9',
  cyanBg: 'rgba(6, 182, 212, 0.18)',

  // WhatsApp Pastel
  whatsapp: '#10B981',
  whatsappBg: 'rgba(16, 185, 129, 0.18)',
  whatsappText: '#6EE7B7',

  // Bordes Maquinados Finos
  borderSubtle: '#1E2536',
  borderHighlight: '#2A3449',
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
