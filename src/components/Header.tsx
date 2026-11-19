interface HeaderProps {
  onNew: () => void
  onFileLoad: (file: File) => void
  onPaste: () => void
  onViewJson: () => void
  onReset: () => void
}

export function Header({ onNew, onFileLoad, onPaste, onViewJson, onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-zinc-950/85 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-3 mr-auto">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 grid place-items-center">
            <span className="text-lg">🧾</span>
          </div>
          <div>
            <div className="font-semibold leading-tight">Blueprints Editor</div>
            <div className="text-xs text-zinc-400">
              Single-page JSON data entry · Load / Save · Autosave · Paging
            </div>
          </div>
        </div>

        <button
          className="px-3 py-2 rounded-xl border text-sm font-medium
            bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200
            dark:bg-emerald-600/90 dark:hover:bg-emerald-600 dark:border-transparent dark:text-white"
          onClick={onNew}
        >
          + New blueprint
        </button>

        <label className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium cursor-pointer">
          Load JSON file
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileLoad(file)
              e.currentTarget.value = ''
            }}
          />
        </label>

        <button
          className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium"
          onClick={onPaste}
        >
          Paste JSON
        </button>

        <button
          className="px-3 py-2 rounded-xl border text-sm font-medium
            bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200
            dark:bg-indigo-600/90 dark:hover:bg-indigo-600 dark:border-transparent dark:text-white"
          onClick={onViewJson}
        >
          View JSON
        </button>

        <button
          className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium"
          onClick={onReset}
        >
          Reset to sample
        </button>
      </div>
    </header>
  )
}
