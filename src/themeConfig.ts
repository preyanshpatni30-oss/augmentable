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
  cyan: {
    primaryRgb: '6 182 212',    // cyan-500
    accentRgb: '34 211 238',    // cyan-400
    lightRgb: '103 232 249',    // cyan-300
  },
  rose: {
    primaryRgb: '244 63 94',    // rose-500
    accentRgb: '251 113 133',   // rose-400
    lightRgb: '253 164 175',    // rose-300
  },
  emerald: {
    primaryRgb: '16 185 129',   // emerald-500
    accentRgb: '52 211 153',    // emerald-400
    lightRgb: '110 231 183',    // emerald-300
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
