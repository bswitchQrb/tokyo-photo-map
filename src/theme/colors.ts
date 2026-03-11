/** アプリ全体のカラーパレット */
export const colors = {
  /** 地図 */
  map: {
    background: '#e2e8f0',
    municipalityDefault: '#ffffff',
    municipalityVisited: '#4ade80',
    municipalityHover: '#e2e8f0',
    municipalityVisitedHover: '#22c55e',
    stroke: '#cbd5e1',
    strokeHover: '#475569',
    border: '#64748b',
    borderWidth: 1.8,
    strokeWidth: 0.8,
    strokeWidthHover: 1.5,
    tooltip: 'rgba(15, 23, 42, 0.85)',
    tooltipText: '#ffffff',
  },

  /** 共通UI */
  ui: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#334155',
    textHeading: '#1e293b',
    textMuted: '#94a3b8',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  },

  /** アクセント（グリーン） */
  accent: {
    base: '#10b981',
    dark: '#059669',
    light: '#34d399',
    bg: '#f0fdf4',
    bgHover: '#dcfce7',
    border: '#bbf7d0',
    preview: '#86efac',
  },

  /** フィードバック */
  feedback: {
    success: '#16a34a',
    successBg: '#f0fdf4',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    errorBgHover: '#fee2e2',
    warning: '#d97706',
    warningBg: '#fffbeb',
  },

  /** プレビューカード */
  preview: {
    success: '#22c55e',
    duplicate: '#f59e0b',
    error: '#ef4444',
  },
} as const;
