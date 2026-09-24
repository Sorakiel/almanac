import { useSearchParams } from 'react-router-dom'

const PARAM = 'new'

/**
 * A page's "new …" form, opened by `?new=1` — how the Create sheet asks the
 * workouts or books page for its form, even when that page is already open.
 * The URL is the state, so Back closes the form rather than leaving the page.
 */
export function useCreateIntent(): [boolean, (open: boolean) => void] {
  const [params, setParams] = useSearchParams()
  const setOpen = (open: boolean) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (open) next.set(PARAM, '1')
        else next.delete(PARAM)
        return next
      },
      { replace: !open },
    )
  return [params.get(PARAM) === '1', setOpen]
}
