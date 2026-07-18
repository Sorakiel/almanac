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
        chrome: withOpacity('--color-chrome'),
        panel: withOpacity('--color-panel'),
        foreground: withOpacity('--color-foreground'),
        muted: withOpacity('--color-muted'),
        'muted-strong': withOpacity('--color-muted-strong'),
        accent: withOpacity('--color-accent'),
        'accent-deep': withOpacity('--color-accent-deep'),
        'on-accent': withOpacity('--color-on-accent'),
        border: withOpacity('--color-border'),
        teal: withOpacity('--color-teal'),
        amber: withOpacity('--color-amber'),
        danger: withOpacity('--color-danger'),
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
      keyframes: {
        // Per-tier "vault door" idle animations for the strength stage tile.
        'vault-shake': {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-2px) rotate(-1deg)' },
          '40%': { transform: 'translateX(2px) rotate(1deg)' },
          '60%': { transform: 'translateX(-1.5px)' },
          '80%': { transform: 'translateX(1.5px)' },
        },
        'vault-pulse': {
          '0%,100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.09)', opacity: '1' },
        },
        'vault-scan': {
          '0%': { transform: 'translateY(-130%)', opacity: '0' },
          '15%,85%': { opacity: '1' },
          '100%': { transform: 'translateY(130%)', opacity: '0' },
        },
        'vault-orbit': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'vault-glow': {
          '0%,100%': { opacity: '0.3', transform: 'scale(0.95)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'vault-shake': 'vault-shake 0.75s ease-in-out infinite',
        'vault-pulse': 'vault-pulse 1.7s ease-in-out infinite',
        'vault-scan': 'vault-scan 2s ease-in-out infinite',
        'vault-orbit': 'vault-orbit 7s linear infinite',
        'vault-glow': 'vault-glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config
