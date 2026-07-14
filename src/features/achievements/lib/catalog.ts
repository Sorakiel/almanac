import {
  BookMarked,
  BookOpen,
  Bug,
  Dumbbell,
  Flame,
  Highlighter,
  Link2,
  NotebookPen,
  Rocket,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import type { AchievementDef } from '@/features/achievements/types'

/** A single ★ tier — used by manual (owner-awarded) badges. */
function manualTier(title: string): AchievementDef['tiers'] {
  return [{ goal: 1, label: '★', title }]
}

/**
 * The achievement catalog. Every entry is derived purely from the user's data
 * (no server-side grants), so unlocks are reproducible and need no extra table.
 * Tiered badges give levels; single-tier badges are one-off honours.
 */
export const CATALOG: AchievementDef[] = [
  {
    id: 'streak',
    title: 'Kept the Flame',
    description: 'Consecutive days keeping a habit.',
    icon: Flame,
    tone: 'accent',
    unit: 'days',
    metric: (s) => s.bestStreak,
    tiers: [
      { goal: 3, label: 'I', title: 'Spark' },
      { goal: 7, label: 'II', title: 'Ember' },
      { goal: 21, label: 'III', title: 'Steady Flame' },
      { goal: 50, label: 'IV', title: 'Blaze' },
      { goal: 100, label: 'V', title: 'Inferno' },
    ],
  },
  {
    id: 'devotion',
    title: 'Slave to My Habits',
    description: 'Logged 100 habit check-offs. There is no escape now.',
    icon: Link2,
    tone: 'accent',
    unit: 'check-offs',
    metric: (s) => s.totalCompletions,
    tiers: [{ goal: 100, label: '★', title: 'Slave to My Habits' }],
  },
  {
    id: 'training',
    title: 'Under the Bar',
    description: 'Workouts completed.',
    icon: Dumbbell,
    tone: 'teal',
    unit: 'sessions',
    metric: (s) => s.workoutsCompleted,
    tiers: [
      { goal: 1, label: 'I', title: 'First Rep' },
      { goal: 10, label: 'II', title: 'Committed' },
      { goal: 30, label: 'III', title: 'Iron Habit' },
      { goal: 100, label: 'IV', title: 'Centurion' },
    ],
  },
  {
    id: 'reading',
    title: 'Cover to Cover',
    description: 'Books finished.',
    icon: BookOpen,
    tone: 'amber',
    unit: 'books',
    metric: (s) => s.booksFinished,
    tiers: [
      { goal: 1, label: 'I', title: 'First Finish' },
      { goal: 5, label: 'II', title: 'Bookworm' },
      { goal: 15, label: 'III', title: 'Well-Read' },
      { goal: 40, label: 'IV', title: 'Bibliophile' },
    ],
  },
  {
    id: 'reflection',
    title: 'Know Thyself',
    description: 'Daily reflections written.',
    icon: NotebookPen,
    tone: 'accent',
    unit: 'entries',
    metric: (s) => s.reflections,
    tiers: [
      { goal: 1, label: 'I', title: 'First Words' },
      { goal: 7, label: 'II', title: 'Journaling' },
      { goal: 30, label: 'III', title: 'Know Thyself' },
      { goal: 100, label: 'IV', title: 'Chronicler' },
    ],
  },
  {
    id: 'polymath',
    title: 'Renaissance',
    description: 'Active across multiple life areas at once.',
    icon: Sparkles,
    tone: 'teal',
    unit: 'areas',
    metric: (s) => s.activeModules,
    tiers: [
      { goal: 2, label: 'I', title: 'Dabbler' },
      { goal: 3, label: 'II', title: 'Multi-Disciplined' },
      { goal: 4, label: 'III', title: 'Renaissance' },
    ],
  },
  {
    id: 'pages',
    title: 'Page Turner',
    description: 'Pages read across your books.',
    icon: BookMarked,
    tone: 'amber',
    unit: 'pages',
    metric: (s) => s.pagesRead,
    tiers: [
      { goal: 250, label: 'I', title: 'Skimmer' },
      { goal: 1000, label: 'II', title: 'Reader' },
      { goal: 3000, label: 'III', title: 'Devourer' },
      { goal: 10000, label: 'IV', title: 'Ink-Blooded' },
    ],
  },
  {
    id: 'beta',
    title: 'Beta User',
    description: 'Here before v1 — thank you for testing Almanac.',
    icon: Rocket,
    tone: 'accent',
    metric: (s) => (s.betaUser ? 1 : 0),
    tiers: [{ goal: 1, label: '★', title: 'Beta User' }],
  },

  {
    id: 'hot_streak',
    title: 'Hot Streak',
    description: 'Your current run of consecutive days.',
    icon: Zap,
    tone: 'accent',
    unit: 'days',
    metric: (s) => s.currentStreak,
    tiers: [
      { goal: 3, label: 'I', title: 'Warming Up' },
      { goal: 7, label: 'II', title: 'On a Roll' },
      { goal: 14, label: 'III', title: 'On Fire' },
      { goal: 30, label: 'IV', title: 'Unstoppable' },
    ],
  },
  {
    id: 'relentless',
    title: 'Relentless',
    description: 'Total habit check-offs, all-time.',
    icon: Target,
    tone: 'teal',
    unit: 'check-offs',
    metric: (s) => s.totalCompletions,
    tiers: [
      { goal: 250, label: 'I', title: 'Dedicated' },
      { goal: 500, label: 'II', title: 'Relentless' },
      { goal: 1000, label: 'III', title: 'Unyielding' },
      { goal: 2500, label: 'IV', title: 'Machine' },
    ],
  },
  {
    id: 'annotator',
    title: 'Annotator',
    description: 'Notes captured while reading.',
    icon: Highlighter,
    tone: 'amber',
    unit: 'notes',
    metric: (s) => s.notesWritten,
    tiers: [
      { goal: 5, label: 'I', title: 'Margin Notes' },
      { goal: 25, label: 'II', title: 'Annotator' },
      { goal: 100, label: 'III', title: 'Scholar' },
    ],
  },

  // ── Owner-awarded (manual) ────────────────────────────────────────────────
  {
    id: 'bug_hunter',
    title: 'Bug Hunter',
    description: 'Found and reported a real bug. The app thanks you.',
    icon: Bug,
    tone: 'teal',
    manual: true,
    metric: () => 0,
    tiers: manualTier('Bug Hunter'),
  },
]

/** The owner-awardable subset, in catalog order. */
export const MANUAL_ACHIEVEMENTS = CATALOG.filter((def) => def.manual)
