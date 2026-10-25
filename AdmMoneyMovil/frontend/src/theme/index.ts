import { useAppStore } from '../stores/app.store';

// ==============================================================================
// 1. PALETA DE COLORES CLARA (Alabaster Silk & Porcelain Gold - Luxury FinTech)
// ==============================================================================
export const lightColors = {
  // Lienzo & Superficies
  bgPrimary: '#F8FAFC',        // Alabastro de seda descansado y luminoso
  bgSecondary: '#FFFFFF',      // Tarjeta blanca pura con relieve háptico
  bgTertiary: '#F1F5F9',       // Pastillas, inputs y contenedores suaves
  bgCard: '#FFFFFF',           // Tarjeta principal
  bgSurface: '#F8FAFC',        // Sub-superficie de listas
  bgModal: '#FFFFFF',          // Modal blanco inmaculado

  // Tipografía
  textMain: '#0B132B',         // Obsidiana grafito de altísima legibilidad
  textMuted: '#475569',        // Pizarra equilibrado
  textDim: '#94A3B8',          // Subtítulo sutil

  // Marca Principal: Zafiro Real / Azul Cielo Eléctrico
  brand: '#0284C7',
  brandLight: '#0284C7',
  brandDark: '#0369A1',
  brandBg: '#E0F2FE',
  brandText: '#0369A1',
  brandBorder: '#BAE6FD',
  brandGlow: 'rgba(2, 132, 199, 0.16)',

  // Pastel Miel / Ámbar Cálido (Galletas & Ventas - Calibrado para alto contraste en fondo claro)
  amber: '#D97706',
  amberLight: '#B45309',
  amberBg: '#FEF3C7',
  amberText: '#92400E',
  amberBorder: '#FDE68A',
  caramel: '#D97706',
  caramelLight: '#B45309',

  // Menta / Esmeralda Jade (Ganancias & Utilidad limpia)
  emerald: '#059669',
  emeraldLight: '#059669',
  emeraldBg: '#D1FAE5',
  emeraldText: '#065F46',
  emeraldBorder: '#A7F3D0',
  sage: '#059669',
  sageLight: '#047857',

  // Rubor Frambuesa / Rosa Gastos
  rose: '#E11D48',
  roseLight: '#E11D48',
  roseBg: '#FFE4E6',
  roseText: '#9F1239',
  roseBorder: '#FECDD3',
  rust: '#E11D48',
  rustLight: '#BE123C',

  // Lavanda / Violeta & Cyan
  purple: '#7C3AED',
  purpleLight: '#7C3AED',
  purpleBg: '#EDE9FE',
  purpleText: '#6D28D9',
  purpleBorder: '#DDD6FE',
  cyan: '#0284C7',
  cyanLight: '#0284C7',
  cyanBg: '#CFFAFE',

  // WhatsApp Pastel
  whatsapp: '#047857',
  whatsappBg: '#D1FAE5',
  whatsappText: '#047857',

  // Bordes & Separadores Suaves
  borderSubtle: '#E2E8F0',
  borderHighlight: '#CBD5E1',
  borderFocus: '#0284C7',

  // Efectos de Luz & Cristal
  glassHighlight: 'rgba(255, 255, 255, 0.95)',
  glassShadow: 'rgba(15, 23, 42, 0.08)',
};

// ==============================================================================
// 2. PALETA DE COLORES OSCURA (Obsidian Cosmic & Neon Aurora - Cyber Elegance)
// ==============================================================================
export const darkColors: typeof lightColors = {
  // Lienzo & Superficies (Graduación progresiva de profundidad)
  bgPrimary: '#07090E',        // Obsidiana cósmica de profundidad infinita
  bgSecondary: '#0E131E',      // Tarjetas elevadas de alta gama
  bgTertiary: '#151C2C',       // Contenedores interactivos y pastillas
  bgCard: '#0E131E',           // Superficie de tarjetas
  bgSurface: '#121826',        // Sub-superficie de listas
  bgModal: '#0E131E',          // Modales oscuros premium

  // Tipografía
  textMain: '#F8FAFC',         // Blanco titanio nítido
  textMuted: '#94A3B8',        // Pizarra claro secundario
  textDim: '#64748B',          // Texto tenue y pies de foto

  // Marca Principal: Azul Cielo Eléctrico Luminoso
  brand: '#0EA5E9',
  brandLight: '#38BDF8',
  brandDark: '#0284C7',
  brandBg: 'rgba(14, 165, 233, 0.16)',
  brandText: '#38BDF8',
  brandBorder: 'rgba(56, 189, 248, 0.32)',
  brandGlow: 'rgba(56, 189, 248, 0.28)',

  // Ámbar / Miel Dorado Cálido
  amber: '#F59E0B',
  amberLight: '#FBBF24',
  amberBg: 'rgba(245, 158, 11, 0.18)',
  amberText: '#FDE047',
  amberBorder: 'rgba(245, 158, 11, 0.35)',
  caramel: '#F59E0B',
  caramelLight: '#FBBF24',

  // Menta / Esmeralda Aurora
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldBg: 'rgba(16, 185, 129, 0.18)',
  emeraldText: '#6EE7B7',
  emeraldBorder: 'rgba(16, 185, 129, 0.35)',
  sage: '#10B981',
  sageLight: '#34D399',

  // Rubor / Carmesí Neón Suave
  rose: '#F43F5E',
  roseLight: '#FB7185',
  roseBg: 'rgba(244, 63, 94, 0.18)',
  roseText: '#FDA4AF',
  roseBorder: 'rgba(244, 63, 94, 0.35)',
  rust: '#F43F5E',
  rustLight: '#FB7185',

  // Lavanda Neón & Cyan
  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleBg: 'rgba(168, 85, 247, 0.18)',
  purpleText: '#D8B4FE',
  purpleBorder: 'rgba(168, 85, 247, 0.35)',
  cyan: '#06B6D4',
  cyanLight: '#67E8F9',
  cyanBg: 'rgba(6, 182, 212, 0.18)',

  // WhatsApp Pastel
  whatsapp: '#10B981',
  whatsappBg: 'rgba(16, 185, 129, 0.18)',
  whatsappText: '#6EE7B7',

  // Bordes Maquinados Finos
  borderSubtle: '#1C2436',
  borderHighlight: '#2A364F',
  borderFocus: '#38BDF8',

  // Efectos de Luz & Cristal
  glassHighlight: 'rgba(255, 255, 255, 0.07)',
  glassShadow: 'rgba(0, 0, 0, 0.55)',
};

// ==============================================================================
// 3. GRADIENTES CALIBRADOS (Cinemáticos, pasteles luminosos y de alta gama)
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
  goldLuxury: ['#F59E0B', '#B45309'] as const,

  // Mint / Sage Profit
  emerald: ['#16A34A', '#15803D'] as const,
  emeraldGlow: ['#22C55E', '#16A34A'] as const,
  mintSoft: ['#DCFCE7', '#BBF7D0'] as const,
  auroraGreen: ['#10B981', '#047857'] as const,

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
  heroDark: ['#172033', '#0F1624', '#090D15'] as const,
  heroPositive: ['#059669', '#047857', '#064E3B'] as const,
  heroNegative: ['#E11D48', '#BE123C', '#9F1239'] as const,

  // Surface Glass Gradients
  cardGlassLight: ['#FFFFFF', '#F8FAFC'] as const,
  cardGlassDark: ['#141A28', '#0E131E'] as const,
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
      ? (['#172033', '#0F1624', '#090D15'] as [string, string, string])
      : (['#0284C7', '#0369A1', '#075985'] as [string, string, string]),
    cardGradient: isDark
      ? (['#141A28', '#0E131E'] as [string, string])
      : (['#FFFFFF', '#F8FAFC'] as [string, string]),
    surfaceGradient: isDark
      ? (['#1D263B', '#151C2C'] as [string, string])
      : (['#F8FAFC', '#F1F5F9'] as [string, string]),
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  outer: 20,
  inner: 14,
  pill: 9999,
};
