import { useRef, useState, useEffect } from 'react'
import type { StatusType } from '../types'

interface ImageFieldProps {
  value: string
  onChange: (value: string) => void
  onStatus: (type: StatusType, msg: string) => void
}

export function ImageField({ value, onChange, onStatus }: ImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Reset error state whenever the image source changes
  useEffect(() => {
    setImgError(false)
  }, [value])

  const textValue = value && !value.startsWith('data:') ? value : ''
  const showImage = !!value && !imgError
  const ringClass = dragOver ? 'ring-2 ring-indigo-500' : ''

  function handleImageFile(file: File | null | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onStatus('warn', 'Only image files are accepted.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (fileInputRef.current) fileInputRef.current.value = ''
          handleImageFile(file)
        }}
      />

      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          value={textValue}
          placeholder="data/images/example.png"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap
            bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200
            dark:bg-indigo-600/90 dark:hover:bg-indigo-600 dark:border-transparent dark:text-white"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse…
        </button>
      </div>

      {showImage ? (
        <img
          src={value}
          alt="Blueprint image preview"
          className={`w-32 h-32 object-contain rounded-xl border border-zinc-800 bg-zinc-950 cursor-pointer ${ringClass}`}
          onClick={() => fileInputRef.current?.click()}
          onError={() => setImgError(true)}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleImageFile(e.dataTransfer?.files?.[0])
          }}
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Click or drag to upload image"
          className={`w-32 h-32 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 grid place-items-center text-zinc-500 text-xs cursor-pointer transition-colors ${ringClass}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click() }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleImageFile(e.dataTransfer?.files?.[0])
          }}
        >
          <div className="text-center pointer-events-none">
            <div className="text-lg mb-1">⬆️</div>
            <div>
              Drop image
              <br />
              or click
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
