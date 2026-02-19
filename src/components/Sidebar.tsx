import { useState } from 'react'
import type { ReactNode } from 'react'

export type AppView = 'blueprints'

interface NavItem {
  id: AppView
  label: string
  icon: ReactNode
}

interface SidebarProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
  isDark: boolean
  onThemeToggle: () => void
}

function BlueprintIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
      <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
      <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'blueprints',
    label: 'Blueprint Editor',
    icon: <BlueprintIcon />,
  },
]

export function Sidebar({ activeView, onNavigate, isDark, onThemeToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`
        flex flex-col shrink-0 bg-zinc-900 border-r border-zinc-800
        transition-[width] duration-200 ease-in-out overflow-hidden
        ${collapsed ? 'w-14' : 'w-64'}
      `}
    >
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 grid place-items-center shrink-0">
          <span className="text-base leading-none">🧾</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-semibold text-sm text-zinc-100 truncate leading-tight">
              Arc Raiders Workbench
            </div>
            <div className="text-[10px] text-zinc-500 truncate">Management tool</div>
          </div>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium
                transition-colors duration-150 text-left
                ${
                  isActive
                    ? 'bg-indigo-100/80 text-indigo-700 border border-indigo-200 dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent'
                }
              `}
            >
              {item.icon}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* ── Theme toggle + Collapse ─────────────────────── */}
      <div className="px-2 py-3 border-t border-zinc-800 space-y-1">
        {/* Dark mode toggle */}
        <button
          onClick={onThemeToggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl
            text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300
            text-xs transition-colors duration-150"
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{isDark ? 'Dark mode' : 'Light mode'}</span>
              {/* pill toggle */}
              <span
                className={`
                  relative inline-flex h-4.5 w-8 shrink-0 rounded-full border-2 border-transparent
                  transition-colors duration-200
                  ${isDark ? 'bg-indigo-600' : 'bg-zinc-600'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow
                    transform transition-transform duration-200
                    ${isDark ? 'translate-x-3.5' : 'translate-x-0'}
                  `}
                />
              </span>
            </>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-xl
            text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 text-xs transition-colors duration-150"
        >
          {collapsed ? <ChevronRightIcon /> : (
            <>
              <ChevronLeftIcon />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
