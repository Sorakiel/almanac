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
import { HabitRow } from '@/features/habits/components/HabitRow'
import { useHabitMutations } from '@/features/habits/hooks/useHabitMutations'
import { cn } from '@/lib/utils'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface SortableHabitListProps {
  habits: HabitWithTodayLog[]
}

/** Today's habit list with drag-and-drop reordering (persists sort_order). */
export function SortableHabitList({ habits }: SortableHabitListProps) {
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
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not save the new order'),
      },
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-border/10">
          {habits.map((habit) => (
            <SortableRow key={habit.id} habit={habit} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({ habit }: { habit: HabitWithTodayLog }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-1', isDragging && 'relative z-10 opacity-80')}
    >
      <button
        type="button"
        aria-label={`Reorder ${habit.name}`}
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-muted-strong hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <HabitRow habit={habit} />
      </div>
    </li>
  )
}
