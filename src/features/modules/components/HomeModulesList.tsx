import type { CSSProperties } from 'react'
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
import { ListSwitch } from '@/features/profile/components/ListSwitch'
import { MODULE_HUE } from '@/features/modules/lib/moduleHue'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'
import { NAV_MODULES, useModulesStore, type OrderedModule } from '@/stores/modules'

/**
 * "On Today": every toggleable module with its switch, in the account's order.
 * A switched-on module gets its card on Today and its place in the sidebar;
 * dragging by the handle (or arrow keys on it) sets the order of both.
 */
export function HomeModulesList() {
  const order = useModulesStore((s) => s.order)
  const setOrder = useModulesStore((s) => s.setOrder)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = order.indexOf(active.id as OrderedModule)
    const to = order.indexOf(over.id as OrderedModule)
    if (from < 0 || to < 0) return
    setOrder(arrayMove(order, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ul className="mods-group">
          {order.map((key) => (
            <HomeModuleRow key={key} moduleKey={key} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function HomeModuleRow({ moduleKey }: { moduleKey: OrderedModule }) {
  const { t } = useT()
  const on = useModulesStore((s) => s.enabled[moduleKey])
  const setModule = useModulesStore((s) => s.setModule)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: moduleKey,
  })
  const module = NAV_MODULES.find((m) => m.key === moduleKey)
  if (!module) return null
  const Icon = module.icon
  const name = t(`modules.${moduleKey}.label`)

  return (
    <li
      ref={setNodeRef}
      className={cn('mods-row', isDragging && 'is-dragging')}
      style={
        {
          transform: CSS.Transform.toString(transform),
          transition,
          '--hue': MODULE_HUE[moduleKey],
        } as CSSProperties
      }
    >
      <button
        type="button"
        className="mods-handle"
        aria-label={t('modulesPage.reorder', { name })}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <span className="mods-ic is-small" aria-hidden="true">
        <Icon strokeWidth={1.9} />
      </span>
      <span className="mods-row-name">{name}</span>
      <ListSwitch
        checked={on}
        onCheckedChange={(next) => setModule(moduleKey, next)}
        aria-label={t('modulesPage.onHome', { name })}
      />
    </li>
  )
}
