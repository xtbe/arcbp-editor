import type { StatusMessage } from '../types'

const statusStyles: Record<string, string> = {
  ok:   'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200',
  warn: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200',
  err:  'bg-red-50 border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200',
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
