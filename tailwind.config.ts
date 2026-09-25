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
      // Wide enough for two content columns beside the sidebar and context rail.
      screens: {
        wide: '1400px',
      },
      colors: {
        bg: withOpacity('--color-bg'),
        'bg-deep': withOpacity('--color-bg-deep'),
        surface: withOpacity('--color-surface'),
        chrome: withOpacity('--color-chrome'),
        panel: withOpacity('--color-panel'),
        sheet: withOpacity('--color-sheet'),
        'sheet-fill': withOpacity('--color-sheet-fill'),
        foreground: withOpacity('--color-foreground'),
        muted: withOpacity('--color-muted'),
        'muted-strong': withOpacity('--color-muted-strong'),
        accent: withOpacity('--color-accent'),
        'accent-deep': withOpacity('--color-accent-deep'),
        'accent-bright': withOpacity('--color-accent-bright'),
        'on-accent': withOpacity('--color-on-accent'),
        'on-accent-deep': withOpacity('--color-on-accent-deep'),
        'accent-solid': withOpacity('--color-accent-solid'),
        'on-accent-solid': withOpacity('--color-on-accent-solid'),
        'accent-solid-hover': withOpacity('--color-accent-solid-hover'),
        border: withOpacity('--color-border'),
        teal: withOpacity('--color-teal'),
        amber: withOpacity('--color-amber'),
        danger: withOpacity('--color-danger'),
        'on-danger': withOpacity('--color-on-danger'),
        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning'),
      },
      // The system face first (SF on Apple), Inter everywhere else. Mono is for
      // numbers only — see `.num` in globals.css.
      fontFamily: {
        sans: ['-apple-system', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      // The type scale, iOS-style: 34 / 28 / 22 / 17 / 15 / 13 / 11. Nothing
      // smaller than 11; body is 17 on a phone. Named by role, so a screen asks
      // for "a footnote" rather than for a pixel size.
      fontSize: {
        'large-title': ['34px', { lineHeight: '41px', letterSpacing: '-0.02em' }],
        title: ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        headline: ['22px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        body: ['17px', { lineHeight: '22px' }],
        callout: ['15px', { lineHeight: '20px' }],
        footnote: ['13px', { lineHeight: '18px' }],
        caption: ['11px', { lineHeight: '13px' }],
      },
      spacing: {
        // Floating layers above the phone's glass bottom nav (toasts, the sync
        // capsule) sit this far up; the capsule's height plus a gap lifts
        // toasts over it.
        'nav-clearance': '104px',
        'capsule-clearance': '52px',
        // Clear of the status bar / notch, never flush with the top edge.
        'safe-top': 'max(env(safe-area-inset-top), 1rem)',
        // The profile avatar's ring on the phone (112 on desktop is `28`).
        avatar: '104px',
      },
      // 28 sheets and containers · 20 cards and groups · 14 controls · 10 inner.
      borderRadius: {
        sheet: '28px',
        card: '20px',
        tile: '14px',
        control: '14px',
        inner: '10px',
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
        // Profile identity: the avatar face, a badge medallion, a segment thumb.
        avatar: '0 8px 24px -8px rgb(0 0 0 / 0.45)',
        medal: 'inset 0 1px 0 rgb(255 255 255 / 0.35), 0 6px 16px -6px rgb(0 0 0 / 0.4)',
        thumb: '0 1px 3px rgb(0 0 0 / 0.2)',
      },
      // Profile on wide screens: identity column + settings.
      gridTemplateColumns: {
        profile: '360px minmax(0, 1fr)',
        // Progress bars: name · track · value (the prototype's `.p-hb`).
        'bar-row': '110px minmax(0, 1fr) 46px',
        'bar-row-wide': '170px minmax(0, 1fr) 46px',
      },
      // iOS-like overshoot for switches and toggles.
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        // iOS sheet curve — detents, disclosures, anything that opens in place.
        sheet: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      // A disclosure that animates its height without measuring it.
      gridTemplateRows: {
        collapsed: '0fr',
        expanded: '1fr',
      },
      transitionProperty: {
        rows: 'grid-template-rows',
      },
      zIndex: {
        // Above sheets and toasts: a celebration is brief and never blocks input.
        celebration: '60',
      },
      backdropBlur: {
        nav: '20px',
      },
      keyframes: {
        // The sync capsule rising in with a little overshoot, as in the prototype.
        'capsule-in': {
          '0%': { transform: 'translateY(12px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
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
        // Current-set beacon: an expanding, fading ring — a heartbeat-style
        // "do this next" pulse around the active set cell.
        beacon: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '75%, 100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'medal-sheen': {
          '0%, 55%': { transform: 'translateX(-120%)' },
          '85%, 100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        'capsule-in': 'capsule-in 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) both',
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
        beacon: 'beacon 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // The newest badge's periodic glint (motion.html: 2.8 s loop, newest only).
        'medal-sheen': 'medal-sheen 2.8s ease-in-out 1s infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config
