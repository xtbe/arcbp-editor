import type { StatusMessage } from '../types'

const statusStyles: Record<string, string> = {
  ok: 'bg-emerald-950/40 border-emerald-900 text-emerald-200',
  warn: 'bg-amber-950/40 border-amber-900 text-amber-200',
  err: 'bg-red-950/40 border-red-900 text-red-200',
  info: 'bg-zinc-900/60 border-zinc-800 text-zinc-200',
}

interface StatusBarProps {
  status: StatusMessage | null
}

export function StatusBar({ status }: StatusBarProps) {
  if (!status) return null
  return (
    <div
      className={`mt-3 px-3 py-2 rounded-xl border text-sm ${statusStyles[status.type] ?? statusStyles['info']}`}
    >
      {status.text}
    </div>
  )
}
