// Theme color configuration for each cafe
// Maps themeColor string to actual RGB values and Tailwind-compatible styles

export interface ThemeColors {
  /** Primary color RGB e.g. "245 158 11" for use in rgba() */
  primaryRgb: string;
  /** Accent/lighter variant RGB */
  accentRgb: string;
  /** Light variant RGB */
  lightRgb: string;
}

const themes: Record<string, ThemeColors> = {
  amber: {
    primaryRgb: '245 158 11',   // amber-500
    accentRgb: '251 191 36',    // amber-400
    lightRgb: '252 211 77',     // amber-300
  },
  warm: {
    primaryRgb: '210 130 80',   // terracotta-caramel — Croft House
    accentRgb: '232 155 100',   // warm peach
    lightRgb: '248 190 145',    // soft blush
  },
};

export function getThemeColors(themeColor: string): ThemeColors {
  return themes[themeColor] || themes.amber;
}

/** Returns a CSS custom property style object to set on the root container */
export function getThemeStyle(themeColor: string): React.CSSProperties {
  const t = getThemeColors(themeColor);
  return {
    '--theme-primary': t.primaryRgb,
    '--theme-accent': t.accentRgb,
    '--theme-light': t.lightRgb,
  } as React.CSSProperties;
}
