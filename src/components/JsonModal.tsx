import type { BlueprintsData } from '../types'
import { toJsonString } from '../lib/storage'
import { downloadJson } from '../lib/utils'

interface JsonModalProps {
  data: BlueprintsData
  onClose: () => void
  onCopied: () => void
  onDownloaded: () => void
  onCopyFailed: () => void
}

export function JsonModal({ data, onClose, onCopied, onDownloaded, onCopyFailed }: JsonModalProps) {
  // Strip PocketBase ids so the exported JSON is portable/clean
  const jsonText = toJsonString(data)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jsonText)
      onCopied()
    } catch {
      onCopyFailed()
    }
  }

  function handleDownload() {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJson(`blueprints_${stamp}.json`, jsonText)
    onDownloaded()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-2">
          <div>
            <div className="font-semibold">JSON Preview</div>
            <div className="text-xs text-zinc-400">This is what will be saved/downloaded</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-xl border text-sm font-medium
                bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200
                dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={handleCopy}
            >
              Copy
            </button>
            <button
              className="px-3 py-2 rounded-xl text-sm font-medium
                bg-indigo-100 border border-indigo-300 text-indigo-700 hover:bg-indigo-200
                dark:bg-indigo-600/90 dark:hover:bg-indigo-600 dark:border-transparent dark:text-white"
              onClick={handleDownload}
            >
              Download
            </button>
            <button
              className="px-3 py-2 rounded-xl border text-sm font-medium
                bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200
                dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        <pre className="p-4 text-xs overflow-auto max-h-[75vh] bg-zinc-950 border-t border-zinc-800">
          {jsonText}
        </pre>
      </div>
    </div>
  )
}
