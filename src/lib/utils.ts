export function clampInt(n: unknown, fallback = 0): number {
  const x = Number(n)
  if (!Number.isFinite(x)) return fallback
  return Math.max(0, Math.trunc(x))
}

export function downloadJson(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
