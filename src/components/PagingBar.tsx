import { memo } from 'react'

interface PagingBarProps {
  countShown: number
  page: number
  pageTotal: number
  pageSize: number
  onPageSizeChange: (size: number) => void
  onPrevPage: () => void
  onNextPage: () => void
}

export const PagingBar = memo(function PagingBar({
  countShown,
  page,
  pageTotal,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: PagingBarProps) {
  return (
    <div className="p-3 border-t border-zinc-800 flex flex-wrap items-center gap-2 justify-between text-xs text-zinc-400">
      <div className="flex items-center gap-2">
        <div>
          <span>{countShown}</span> shown
        </div>
        <div className="text-zinc-500">·</div>
        <div>
          Page <span>{page}</span>/<span>{pageTotal}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="text-zinc-400">Per page</span>
          <select
            className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        <button
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={page <= 1}
          onClick={onPrevPage}
        >
          Prev
        </button>

        <button
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={page >= pageTotal}
          onClick={onNextPage}
        >
          Next
        </button>

        <div className="text-zinc-500 hidden sm:block">
          Autosave: <span className="text-zinc-300">on</span>
        </div>
      </div>
    </div>
  )
})
