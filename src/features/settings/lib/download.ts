/**
 * Save a generated file. An `<a download>` click is the only mechanism that works
 * in every shell we ship, but Android's WebView silently ignores it for blob URLs,
 * so we hand those to the share sheet when the platform offers one.
 */
export async function saveFile(filename: string, contents: string, mime: string): Promise<void> {
  const file = new File([contents], filename, { type: mime })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (error) {
      // A user-cancelled share is not a failure — and neither is one the platform
      // refused mid-flight; fall through to the anchor rather than surfacing it.
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // Revoking immediately can race the download in Safari.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
