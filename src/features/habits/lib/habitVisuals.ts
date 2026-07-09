import {
  BookOpen,
  Brain,
  Droplet,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  Sparkles,
  Sprout,
  Sun,
  type LucideIcon,
} from 'lucide-react'

/** Category color keys stored in habits.color, mapped to design tokens. */
export type HabitColor = 'accent' | 'teal' | 'amber' | 'muted'

interface ColorStyle {
  /** Icon-tile background + foreground. */
  tile: string
  /** Solid fill (color-picker swatch). */
  solid: string
  /** Solid foreground (sparkline stroke, accents) as a CSS color. */
  stroke: string
}

export const HABIT_COLORS: Record<HabitColor, ColorStyle> = {
  accent: { tile: 'bg-accent/15 text-accent', solid: 'bg-accent', stroke: 'rgb(var(--color-accent))' },
  teal: { tile: 'bg-teal/15 text-teal', solid: 'bg-teal', stroke: 'rgb(var(--color-teal))' },
  amber: { tile: 'bg-amber/15 text-amber', solid: 'bg-amber', stroke: 'rgb(var(--color-amber))' },
  muted: { tile: 'bg-border/10 text-muted', solid: 'bg-muted', stroke: 'rgb(var(--color-muted))' },
}

export const HABIT_COLOR_OPTIONS = Object.keys(HABIT_COLORS) as HabitColor[]

/** Icon keys stored in habits.icon, mapped to lucide icons. */
export const HABIT_ICONS = {
  flame: Flame,
  droplet: Droplet,
  book: BookOpen,
  dumbbell: Dumbbell,
  brain: Brain,
  sparkles: Sparkles,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  sprout: Sprout,
} satisfies Record<string, LucideIcon>

export type HabitIcon = keyof typeof HABIT_ICONS

export const HABIT_ICON_OPTIONS = Object.keys(HABIT_ICONS) as HabitIcon[]

export function resolveHabitColor(color: string | null): ColorStyle {
  return HABIT_COLORS[(color as HabitColor) ?? 'accent'] ?? HABIT_COLORS.accent
}

export function resolveHabitIcon(icon: string | null): LucideIcon {
  return HABIT_ICONS[(icon as HabitIcon) ?? 'sparkles'] ?? HABIT_ICONS.sparkles
}
