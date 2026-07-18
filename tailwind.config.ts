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
        // Bouncy one-shot scale — completion toggles, badges, icons.
        pop: {
          '0%': { transform: 'scale(0.7)' },
          '55%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        // Expanding, fading ring — a "confirmed" pulse behind an action.
        ripple: {
          '0%': { transform: 'scale(0.6)', opacity: '0.5' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        // Looping sweep for loading skeletons.
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // One-shot diagonal gloss — achievement unlock sheen.
        shine: {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)', opacity: '0' },
          '20%': { opacity: '0.9' },
          '100%': { transform: 'translateX(240%) skewX(-12deg)', opacity: '0' },
        },
        // Confetti piece — flies out along per-piece CSS vars, then fades.
        'confetti-burst': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) rotate(var(--rot))', opacity: '0' },
        },
        // Hard on/off blink for the terminal caret.
        'caret-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        pop: 'pop 0.4s ease-out',
        ripple: 'ripple 0.6s ease-out',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        shine: 'shine 0.9s ease-out',
        'confetti-burst': 'confetti-burst 0.9s ease-out forwards',
        'caret-blink': 'caret-blink 1.1s step-end infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config
