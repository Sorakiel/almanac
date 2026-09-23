import { Fragment, type ReactNode } from 'react'

interface TransProps {
  /** A translated template still holding its `{name}` placeholders. */
  text: string
  /** Nodes to drop in for each placeholder — styled spans, links. */
  values: Record<string, ReactNode>
}

/**
 * Render a translation whose placeholders need markup, so word order stays the
 * dictionary's business instead of being split across JSX. Call `t(key)`
 * without the vars: unmatched placeholders survive interpolation.
 */
export function Trans({ text, values }: TransProps) {
  return (
    <>
      {text.split(/(\{\w+\})/).map((part, i) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1]
        return <Fragment key={i}>{name && name in values ? values[name] : part}</Fragment>
      })}
    </>
  )
}
