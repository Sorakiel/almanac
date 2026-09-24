import { useNavigate } from 'react-router-dom'
import {
  ChartNoAxesColumn,
  Check,
  House,
  LayoutGrid,
  Plus,
  Sun,
  Timer,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import { useT } from '@/hooks/useT'
import { useFocusStore } from '@/stores/focus'
import { useModulesStore } from '@/stores/modules'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'

/** The prototype's "Начать фокус 25 минут". */
const FOCUS_MINUTES = 25

export interface PaletteCommand {
  id: string
  label: string
  /** Right-hand hint: the kind of command, or its shortcut. */
  group: string
  icon: LucideIcon
  run: () => void
}

/**
 * Everything ⌘K can do right now: today's habits first (the daily loop), then
 * creating, navigating and the theme. Built fresh each render so labels follow
 * the language and habit state follows the cache.
 */
export function usePaletteCommands(): PaletteCommand[] {
  const { t } = useT()
  const navigate = useNavigate()
  const { habits } = useHabits()
  const toggle = useToggleHabit()
  const openNewHabit = useUiStore((s) => s.openNewHabit)
  const startFocus = useFocusStore((s) => s.start)
  const focusOn = useModulesStore((s) => s.enabled.flow)
  const resolved = useThemeStore((s) => s.resolved)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const go = (to: string) => () => navigate(to, { viewTransition: true })

  const habitCommands: PaletteCommand[] = habits
    .filter((h) => h.dueToday || h.isComplete)
    .map((habit) => ({
      id: `habit:${habit.id}`,
      label: t(habit.isComplete ? 'palette.unmark' : 'palette.mark', { name: habit.name }),
      group: t('palette.groupHabit'),
      icon: habit.isComplete ? X : Check,
      run: () => toggle.mutate({ habit }),
    }))

  return [
    ...habitCommands,
    ...(focusOn
      ? [
          {
            id: 'focus',
            label: t('palette.startFocus', { count: FOCUS_MINUTES }),
            group: t('palette.groupFocus'),
            icon: Timer,
            run: () => {
              startFocus(FOCUS_MINUTES)
              navigate('/flow', { viewTransition: true })
            },
          },
        ]
      : []),
    { id: 'new-habit', label: t('palette.newHabit'), group: '⌘N', icon: Plus, run: openNewHabit },
    {
      id: 'go:today',
      label: t('palette.open', { name: t('nav.today') }),
      group: t('palette.groupGo'),
      icon: House,
      run: go('/'),
    },
    {
      id: 'go:progress',
      label: t('palette.open', { name: t('nav.progress') }),
      group: t('palette.groupGo'),
      icon: ChartNoAxesColumn,
      run: go('/insights'),
    },
    {
      id: 'go:modules',
      label: t('palette.open', { name: t('nav.modules') }),
      group: t('palette.groupGo'),
      icon: LayoutGrid,
      run: go('/more'),
    },
    {
      id: 'go:profile',
      label: t('palette.openProfile'),
      group: t('palette.groupGo'),
      icon: UserRound,
      run: go('/profile'),
    },
    {
      id: 'theme',
      label: resolved === 'dark' ? t('palette.themeCoffee') : t('palette.themeDark'),
      group: t('palette.groupView'),
      icon: Sun,
      run: toggleTheme,
    },
  ]
}
