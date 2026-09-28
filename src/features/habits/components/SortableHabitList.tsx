import { createElement, type CSSProperties } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { frequencyLabel } from '@/features/habits/lib/frequency'
import { resolveHabitColor, resolveHabitIcon } from '@/features/habits/lib/habitVisuals'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface SortableHabitListProps {
  habits: HabitWithTodayLog[]
}

/**
 * The habits in Today's order, dragged by the handle (or arrow keys on it) —
 * Modules → Customize, now that there is no separate habits screen (S2).
 * Persists `sort_order`.
 */
export function SortableHabitList({ habits }: SortableHabitListProps) {
  const { t } = useT()
  const { reorder } = useHabitMutations()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = habits.findIndex((h) => h.id === active.id)
    const to = habits.findIndex((h) => h.id === over.id)
    if (from < 0 || to < 0) return
    const next = arrayMove(habits, from, to)
    reorder.mutate(
      next.map((h, index) => ({ id: h.id, sort_order: index })),
      {
        onError: (error) => toast.error(toUserError(error, t, 'habits.reorderFailed')),
      },
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
        <ul className="mods-group">
          {habits.map((habit) => (
            <SortableRow key={habit.id} habit={habit} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

/** A habit as Customize lists it: the grip, its icon in its colour, name and cadence. */
function SortableRow({ habit }: { habit: HabitWithTodayLog }) {
  const { t } = useT()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={
        {
          transform: CSS.Transform.toString(transform),
          transition,
          '--hue': resolveHabitColor(habit.color).stroke,
        } as CSSProperties
      }
      className={cn('mods-row', isDragging && 'is-dragging')}
    >
      <button
        type="button"
        className="mods-handle"
        aria-label={t('habits.aria.reorder', { name: habit.name })}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <span className="mods-ic is-small" aria-hidden="true">
        {createElement(resolveHabitIcon(habit.icon), { strokeWidth: 1.9 })}
      </span>
      <span className="mods-row-name">{habit.name}</span>
      <span className="flex-none pr-4 text-footnote text-muted">{frequencyLabel(habit, t)}</span>
    </li>
  )
}
