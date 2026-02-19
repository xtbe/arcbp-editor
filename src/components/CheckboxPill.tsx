interface CheckboxPillProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}

export function CheckboxPill({ label, checked, onChange }: CheckboxPillProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer select-none ${
        checked
          ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-100'
          : 'bg-zinc-950 border-zinc-800 text-zinc-200'
      }`}
    >
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`w-4 h-4 rounded-md border ${
          checked ? 'border-indigo-400 bg-indigo-500 dark:bg-indigo-600' : 'border-zinc-600 bg-transparent'
        }`}
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  )
}
