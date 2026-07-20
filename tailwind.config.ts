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
        success: withOpacity('--color-success'),
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
        // Content settles into place — fade up a few px. Staggered by <Cascade>
        // to make a view assemble on open rather than snapping in at once.
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Living streak flame — a gentle, irregular breathe/lick so lit streaks
        // feel alive without being distracting.
        'flame-flicker': {
          '0%, 100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
          '35%': { transform: 'scale(1.12) translateY(-0.5px)', opacity: '0.85' },
          '70%': { transform: 'scale(0.96) translateY(0.5px)', opacity: '0.95' },
        },
        // Soft breathing glow — the completion donut at a perfect 100%.
        'soft-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.75' },
        },
        // Heatmap cell settling in — used with a diagonal per-cell delay so the
        // grid fills as a wave from the corner.
        'cell-in': {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Focus console: a radar wedge sweeping around the orb.
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Focus console: a CRT scanline gliding down the panel (top is relative
        // to the panel, so it spans whatever height the console ends up).
        scanline: {
          '0%': { top: '-15%' },
          '100%': { top: '115%' },
        },
      },
      animation: {
        pop: 'pop 0.4s ease-out',
        ripple: 'ripple 0.6s ease-out',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        shine: 'shine 0.9s ease-out',
        'confetti-burst': 'confetti-burst 0.9s ease-out forwards',
        'caret-blink': 'caret-blink 1.1s step-end infinite',
        // `both` fill: the item holds at opacity 0 through its stagger delay,
        // so nothing flashes before its turn.
        rise: 'rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'flame-flicker': 'flame-flicker 1.8s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 2.2s ease-in-out infinite',
        'cell-in': 'cell-in 0.3s ease-out both',
        'radar-sweep': 'radar-sweep 4.5s linear infinite',
        scanline: 'scanline 4.5s linear infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config
