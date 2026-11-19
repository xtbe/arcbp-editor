import { useState } from 'react'
import type { BlueprintsData } from '../types'
import { ensureShape } from '../lib/dataUtils'

interface PasteModalProps {
  onLoad: (data: BlueprintsData) => void
  onClose: () => void
}

export function PasteModal({ onLoad, onClose }: PasteModalProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  function handleLoad() {
    setError('')
    try {
      const parsed = ensureShape(JSON.parse(text) as unknown)
      onLoad(parsed)
      onClose()
    } catch (e) {
      setError(`Parse error: ${(e as Error).message ?? String(e)}`)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="font-semibold">Paste JSON</div>
            <div className="text-xs text-zinc-400">
              Must be a JSON object with a{' '}
              <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-100 text-[11px]">blueprints</code> array
            </div>
          </div>
          <button
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-4">
          <textarea
            className="w-full h-64 p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            placeholder='{"blueprints":[{"name":"Example","workshop":"Gunsmith I","image":"data/images/example.png","crafting_recipe":[{"item":"Duct Tape","quantity":1}],"available":true,"loot":false,"harvester_event":false,"quest_reward":false,"trials_reward":false}]}'
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="mt-3 flex items-center gap-2 justify-end">
            <button
              className="px-3 py-2 rounded-xl border text-sm font-medium
                bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200
                dark:bg-indigo-600/90 dark:hover:bg-indigo-600 dark:border-transparent dark:text-white"
              onClick={handleLoad}
            >
              Load
            </button>
          </div>
          {error && <div className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</div>}
        </div>
      </div>
    </div>
  )
}
