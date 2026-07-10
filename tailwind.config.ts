import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * Colors are declared as space-separated RGB channels in `styles/tokens.css`
 * and consumed here via `rgb(var(--token) / <alpha-value>)` so Tailwind's
 * opacity modifiers (e.g. `bg-surface/60` for glassmorphism) keep working.
 * No hard-coded hex lives in components — only these semantic tokens.
 */
const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: withOpacity('--color-bg'),
        'bg-deep': withOpacity('--color-bg-deep'),
        surface: withOpacity('--color-surface'),
        foreground: withOpacity('--color-foreground'),
        muted: withOpacity('--color-muted'),
        'muted-strong': withOpacity('--color-muted-strong'),
        accent: withOpacity('--color-accent'),
        'accent-deep': withOpacity('--color-accent-deep'),
        'on-accent': withOpacity('--color-on-accent'),
        border: withOpacity('--color-border'),
        teal: withOpacity('--color-teal'),
        amber: withOpacity('--color-amber'),
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Text', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        tile: '14px',
        card: '22px',
        sheet: '34px',
        pill: '999px',
      },
      letterSpacing: {
        label: '0.14em',
        title: '-0.02em',
      },
      boxShadow: {
        soft: '0 20px 60px -20px rgb(0 0 0 / 0.45)',
        card: '0 8px 32px -12px rgb(0 0 0 / 0.35)',
        // Accent glow under primary CTAs — the spec board's signature highlight.
        glow: '0 12px 26px -8px rgb(var(--color-accent) / 0.55)',
      },
      backdropBlur: {
        nav: '20px',
      },
    },
  },
  plugins: [animate],
} satisfies Config
