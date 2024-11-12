import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

export default function ContextMenu({
  open,
  clickOrigin,
  children,
  onDismiss,
}: {
  open: boolean
  clickOrigin?: { x: number; y: number } | undefined
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
    <Backdrop open={open} onDismiss={onDismiss}>
      <div
        className="fixed opacity-100 z-40"
        style={
          clickOrigin
            ? {
                left: clickOrigin.x,
                top: clickOrigin.y,
                translate: `-${menuRect?.width ?? 0}px`,
              }
            : { top: 0, left: 0 }
        }
        ref={menuRef}
      >
        {children}
      </div>
    </Backdrop>
  )
}

export function Backdrop({
  open,
  onDismiss,
  children,
}: {
  open: boolean
  onDismiss: () => void
  children: React.ReactNode
}) {
  return (
    <>
      {open && <div className="absolute z-40">{children}</div>}
      <div
        className={clsx(
          'fixed top-0 left-0 w-screen h-screen z-30 bg-slate-500/30 dark:bg-slate-900 transition-opacity duration-200',
          {
            'invisible opacity-0': !open,
          },
        )}
        onClick={onDismiss}
        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
          console.log('test')
          if (event.key === 'Escape') {
            onDismiss()
          }
        }}
      ></div>
    </>
  )
}
