import { useLayoutEffect, useRef } from 'react'
import { useNavigationType } from 'react-router-dom'
import { markEntered, routeMotion } from '@/lib/routeMotion'

/**
 * Tell the stylesheet how the route change now under way should move, and
 * retire the screen being left from the entrance cascade.
 *
 * A layout effect on purpose: React Router commits a `viewTransition`
 * navigation inside `startViewTransition`, and this runs within that commit —
 * before the transition's pseudo-elements take their animations from
 * `<html data-route-motion>`.
 */
export function useRouteMotion(pathname: string): void {
  const navigationType = useNavigationType()
  const previous = useRef(pathname)

  useLayoutEffect(() => {
    const from = previous.current
    if (from === pathname) return
    document.documentElement.dataset.routeMotion = routeMotion(
      from,
      pathname,
      navigationType === 'POP',
    )
    markEntered(from)
    previous.current = pathname
  }, [pathname, navigationType])
}
