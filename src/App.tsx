import { useState, useCallback, useEffect } from 'react'
import type { Blueprint, BlueprintsData, FilterAvailability, RecipeItem, StatusMessage, StatusType } from './types'
import { ensureShape, getFilteredIndices } from './lib/dataUtils'
import { useTheme } from './lib/theme'
import {
  fetchBlueprints,
  createBlueprint,
  updateBlueprint as apiUpdateBlueprint,
  deleteBlueprint as apiDeleteBlueprint,
  replaceAllBlueprints,
} from './lib/api'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import type { AppView } from './components/Sidebar'
import { BlueprintList } from './components/BlueprintList'
import { BlueprintEditor } from './components/BlueprintEditor'
import { StatusBar } from './components/StatusBar'
import { PasteModal } from './components/PasteModal'
import { JsonModal } from './components/JsonModal'

function App() {
  const { resolved: resolvedTheme, toggleTheme } = useTheme()
  const [activeView, setActiveView] = useState<AppView>('blueprints')
  const [data, setData] = useState<BlueprintsData>({ blueprints: [] })
  const [loading, setLoading] = useState(true)
  const [pbError, setPbError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [filterAvailability, setFilterAvailability] = useState<FilterAvailability>('all')
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [pasteModalOpen, setPasteModalOpen] = useState(false)

  // ── Bootstrap: load all blueprints from PocketBase ─────────────────────────

  function loadBlueprints() {
    setLoading(true)
    setPbError(null)
    fetchBlueprints()
      .then((blueprints) => {
        setData({ blueprints })
        setStatus({ type: 'info', text: `Loaded ${blueprints.length} blueprint(s) from PocketBase.` })
      })
      .catch((err: unknown) => {
        // Ignore auto-cancelled requests (React StrictMode double-invokes effects)
        if ((err as { isAbort?: boolean }).isAbort) return

        const status = (err as { status?: number }).status
        const message = (err as Error).message ?? String(err)
        // status 0 = TCP-level failure — server is not running or not reachable
        const isNetworkError =
          status === 0 ||
          message.toLowerCase().includes('failed to fetch') ||
          message.toLowerCase().includes('failed to connect')
        if (isNetworkError) {
          setPbError(
            `Cannot connect to PocketBase at http://localhost:8090. ` +
            `Make sure PocketBase is running.`
          )
        } else {
          setStatus({ type: 'err', text: `PocketBase error: ${message}` })
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBlueprints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep selected item on its correct page when search/filter changes
  useEffect(() => {
    if (selectedIndex < 0) return
    const filtered = getFilteredIndices(data.blueprints, search, filterAvailability)
    const pos = filtered.indexOf(selectedIndex)
    if (pos === -1) return
    setPage(Math.floor(pos / pageSize) + 1)
    // Intentionally only runs when search/filter changes, not on every pageSize change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterAvailability])

  // ── Status helper ───────────────────────────────────────────────────────────

  const setStatusMsg = useCallback((type: StatusType, text: string) => {
    setStatus({ type, text })
  }, [])

  // ── Data mutations ──────────────────────────────────────────────────────────

  const updateBlueprint = useCallback((index: number, updates: Partial<Blueprint>) => {
    const bp = data.blueprints[index]
    if (!bp?.id) return
    // Optimistic update
    setData((prev) => {
      const blueprints = [...prev.blueprints]
      blueprints[index] = { ...blueprints[index], ...updates }
      return { ...prev, blueprints }
    })
    apiUpdateBlueprint(bp.id, updates).catch((err: unknown) => {
      setStatus({ type: 'err', text: `Save failed: ${(err as Error).message ?? String(err)}` })
      // Re-fetch to restore consistent state
      fetchBlueprints().then((blueprints) => setData({ blueprints })).catch(() => null)
    })
  }, [data.blueprints])

  const updateRecipeItem = useCallback(
    (bpIndex: number, recipeIndex: number, updates: Partial<RecipeItem>) => {
      const bp = data.blueprints[bpIndex]
      if (!bp?.id) return
      const recipe = [...bp.crafting_recipe]
      recipe[recipeIndex] = { ...recipe[recipeIndex], ...updates }
      updateBlueprint(bpIndex, { crafting_recipe: recipe })
    },
    [data.blueprints, updateBlueprint],
  )

  const addRecipeItem = useCallback((bpIndex: number) => {
    const bp = data.blueprints[bpIndex]
    if (!bp?.id) return
    const recipe = [...bp.crafting_recipe, { item: '', quantity: 0 }]
    updateBlueprint(bpIndex, { crafting_recipe: recipe })
  }, [data.blueprints, updateBlueprint])

  const removeRecipeItem = useCallback((bpIndex: number, recipeIndex: number) => {
    const bp = data.blueprints[bpIndex]
    if (!bp?.id) return
    const recipe = bp.crafting_recipe.filter((_, i) => i !== recipeIndex)
    updateBlueprint(bpIndex, { crafting_recipe: recipe })
  }, [data.blueprints, updateBlueprint])

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  async function handleNew() {
    const newBp: Omit<Blueprint, 'id'> = {
      name: 'New Blueprint',
      workshop: '',
      image: '',
      crafting_recipe: [{ item: '', quantity: 0 }],
      available: true,
      loot: false,
      harvester_event: false,
      quest_reward: false,
      trials_reward: false,
    }
    try {
      const created = await createBlueprint(newBp)
      setData((prev) => ({ blueprints: [...prev.blueprints, created] }))
      setSelectedIndex(data.blueprints.length) // new item is at the end
      setStatus({ type: 'ok', text: 'Added a new blueprint.' })
    } catch (err: unknown) {
      setStatus({ type: 'err', text: `Create failed: ${(err as Error).message ?? String(err)}` })
    }
  }

  async function handleDelete() {
    if (selectedIndex < 0) return
    const bp = data.blueprints[selectedIndex]
    if (!bp?.id) return
    const name = bp.name || 'this blueprint'
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await apiDeleteBlueprint(bp.id)
      const blueprints = data.blueprints.filter((_, i) => i !== selectedIndex)
      setData({ blueprints })
      setSelectedIndex(Math.min(selectedIndex, blueprints.length - 1))
      setStatus({ type: 'ok', text: 'Deleted.' })
    } catch (err: unknown) {
      setStatus({ type: 'err', text: `Delete failed: ${(err as Error).message ?? String(err)}` })
    }
  }

  async function handleDuplicate() {
    if (selectedIndex < 0) return
    const original = data.blueprints[selectedIndex]
    if (!original) return
    const { id: _id, ...fields } = original
    const copy: Omit<Blueprint, 'id'> = {
      ...structuredClone(fields),
      name: original.name ? `${original.name} (Copy)` : 'Copy',
    }
    try {
      const created = await createBlueprint(copy)
      const blueprints = [...data.blueprints]
      blueprints.splice(selectedIndex + 1, 0, created)
      setData({ blueprints })
      setSelectedIndex(selectedIndex + 1)
      setStatus({ type: 'ok', text: 'Duplicated.' })
    } catch (err: unknown) {
      setStatus({ type: 'err', text: `Duplicate failed: ${(err as Error).message ?? String(err)}` })
    }
  }

  async function handleReset() {
    if (!confirm('Reset to sample data? This will delete all current blueprints in the database.')) return
    const { SAMPLE } = await import('./lib/sampleData')
    try {
      const blueprints = await replaceAllBlueprints(SAMPLE.blueprints)
      setData({ blueprints })
      setSelectedIndex(-1)
      setPage(1)
      setPageSize(10)
      setStatus({ type: 'ok', text: 'Reset to sample.' })
    } catch (err: unknown) {
      setStatus({ type: 'err', text: `Reset failed: ${(err as Error).message ?? String(err)}` })
    }
  }

  async function handleFileLoad(file: File) {
    try {
      const text = await file.text()
      const parsed = ensureShape(JSON.parse(text) as unknown)
      const blueprints = await replaceAllBlueprints(parsed.blueprints)
      setData({ blueprints })
      setSelectedIndex(-1)
      setPage(1)
      setStatus({ type: 'ok', text: `Imported ${blueprints.length} blueprint(s) from ${file.name}.` })
    } catch (e) {
      setStatus({ type: 'err', text: `Import failed: ${(e as Error).message ?? String(e)}` })
    }
  }

  async function handlePasteLoad(parsed: BlueprintsData) {
    try {
      const blueprints = await replaceAllBlueprints(parsed.blueprints)
      setData({ blueprints })
      setSelectedIndex(-1)
      setPage(1)
      setStatus({ type: 'ok', text: `Imported ${blueprints.length} blueprint(s) from pasted JSON.` })
    } catch (err: unknown) {
      setStatus({ type: 'err', text: `Import failed: ${(err as Error).message ?? String(err)}` })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedBlueprint = selectedIndex >= 0 ? data.blueprints[selectedIndex] : null

  return (
    <div className="bg-zinc-950 text-zinc-100 flex h-screen overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isDark={resolvedTheme === 'dark'}
        onThemeToggle={toggleTheme}
      />

      {/* ── Main column ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onNew={() => { void handleNew() }}
          onFileLoad={handleFileLoad}
          onPaste={() => setPasteModalOpen(true)}
          onViewJson={() => setJsonModalOpen(true)}
          onReset={() => { void handleReset() }}
        />

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm gap-3">
            <svg className="animate-spin w-5 h-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Connecting to PocketBase…
          </div>
        ) : pbError ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full rounded-2xl border border-red-900/50 bg-red-950/20 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔌</span>
                <div>
                  <div className="font-semibold text-red-300">PocketBase not reachable</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{pbError}</div>
                </div>
              </div>
              <div className="text-sm text-zinc-300 space-y-1">
                <p className="font-medium">To start PocketBase locally:</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>Run <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs">docker compose up api</code> in the project root</li>
                  <li>Open <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs">http://localhost:8090/_/</code> and create your admin account</li>
                  <li>Create the <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs">blueprints</code> collection (see README)</li>
                </ol>
              </div>
              <button
                className="w-full px-4 py-2 rounded-xl border text-sm font-medium
                  bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200
                  dark:bg-indigo-600/90 dark:hover:bg-indigo-600 dark:border-transparent dark:text-white"
                onClick={loadBlueprints}
              >
                Retry connection
              </button>
            </div>
          </div>
        ) : (
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: list */}
              <section className="lg:col-span-5 xl:col-span-4">
                <BlueprintList
                  blueprints={data.blueprints}
                  selectedIndex={selectedIndex}
                  search={search}
                  filterAvailability={filterAvailability}
                  page={page}
                  pageSize={pageSize}
                  onSearchChange={(q) => { setSearch(q); setPage(1) }}
                  onFilterChange={(f) => { setFilterAvailability(f); setPage(1) }}
                  onSelect={setSelectedIndex}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
                />
                <StatusBar status={status} />
              </section>

              {/* Right: editor */}
              <section className="lg:col-span-7 xl:col-span-8">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                    <div className="mr-auto">
                      <div className="font-semibold">Editor</div>
                      <div className="text-xs text-zinc-400">Select a blueprint on the left to edit</div>
                    </div>
                    <button
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={selectedIndex < 0}
                      onClick={() => { void handleDuplicate() }}
                    >
                      Duplicate
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed
                        bg-red-100 border-red-300 text-red-700 hover:bg-red-200
                        dark:bg-red-600/90 dark:hover:bg-red-600 dark:border-transparent dark:text-white"
                      disabled={selectedIndex < 0}
                      onClick={() => { void handleDelete() }}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="p-4">
                    {selectedBlueprint ? (
                      // key=selectedIndex forces a full remount when switching blueprints,
                      // resetting any local UI state (drag-over, image error, etc.)
                      <BlueprintEditor
                        key={selectedIndex}
                        blueprint={selectedBlueprint}
                        onUpdate={(updates) => updateBlueprint(selectedIndex, updates)}
                        onUpdateRecipeItem={(ri, updates) => updateRecipeItem(selectedIndex, ri, updates)}
                        onAddRecipeItem={() => addRecipeItem(selectedIndex)}
                        onRemoveRecipeItem={(ri) => removeRecipeItem(selectedIndex, ri)}
                        onStatus={setStatusMsg}
                      />
                    ) : (
                      <div className="text-zinc-400 text-sm">No blueprint selected.</div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
        )}
      </div>

      {pasteModalOpen && (
        <PasteModal
          onLoad={(parsed) => { void handlePasteLoad(parsed) }}
          onClose={() => setPasteModalOpen(false)}
        />
      )}

      {jsonModalOpen && (
        <JsonModal
          data={data}
          onClose={() => setJsonModalOpen(false)}
          onCopied={() => setStatus({ type: 'ok', text: 'Copied JSON to clipboard.' })}
          onDownloaded={() => setStatus({ type: 'ok', text: 'Downloaded JSON.' })}
          onCopyFailed={() => setStatus({ type: 'warn', text: 'Clipboard copy failed (browser permissions).' })}
        />
      )}
    </div>
  )
}

export default App
