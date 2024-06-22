import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

export default function ContextMenu({
  open,
  clickOrigin,
  children,
  onDismiss,
}: {
  open: boolean
  clickOrigin: { x: number; y: number } | undefined
  children: React.ReactNode
  onDismiss: () => void
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!menuRef.current) {
      return
    }

    setMenuRect(menuRef.current.getBoundingClientRect())
  }, [clickOrigin])

  return (
    <>
      <div
        className={clsx(
          'fixed top-0 left-0 w-screen h-screen z-10 bg-slate-500 transition-opacity duration-200',
          {
            'invisible opacity-0': !open,
            'opacity-50': open,
          },
        )}
        onClick={onDismiss}
        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
          console.log('test')
          if (event.key === 'Escape') {
            onDismiss()
          }
        }}
      />
      {open && clickOrigin && (
        <div
          className="fixed opacity-100 z-10"
          style={{
            left: clickOrigin.x,
            top: clickOrigin.y,
            translate: `-${menuRect?.width ?? 0}px`,
          }}
          ref={menuRef}
        >
          {children}
        </div>
      )}
    </>
  )
}
