import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

export default function Tile({
  initialPos,
  scale,
  children,
}: {
  initialPos: { x: number; y: number }
  scale: number
  children: React.ReactNode
}) {
  const [pos, setPos] = useState(initialPos)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }
    const containerRect = containerRef.current.getBoundingClientRect()
    if (!initialized.current) {
      setPos((prev) => ({
        x: prev.x - containerRect.width / 2,
        y: prev.y - containerRect.height / 2,
      }))
    }
    initialized.current = true
  }, [])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!isPressed || !containerRef.current) {
        return
      }

      setPos({
        x: event.clientX * scale - offset.x,
        y: event.clientY * scale - offset.y,
      })
    }
    const onMouseUp = () => {
      setIsPressed(false)
      setOffset({ x: 0, y: 0 })
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isPressed, offset, scale])

  return (
    <div
      ref={containerRef}
      className={clsx(
        'absolute group cursor-pointer bg-white dark:bg-zinc-800 transition-opacity duration-500 rounded',
        {
          'drop-shadow': !isPressed,
          'drop-shadow-lg': isPressed,
          'opacity-0': !initialized.current,
          'opacity-100': initialized.current,
        },
      )}
      style={{
        left: pos.x,
        top: pos.y,
      }}
    >
      <div className="relative">
        <div
          className="absolute w-full h-12 p-1 rounded"
          onMouseDown={(event) => {
            if (!containerRef.current) {
              return
            }
            setIsPressed(true)
            setOffset({
              x: event.clientX * scale - containerRef.current.offsetLeft,
              y: event.clientY * scale - containerRef.current.offsetTop,
            })
          }}
        >
          <div className="size-full  group-hover:border-2 border-slate-300 dark:border-zinc-500 rounded  border-dashed"></div>
        </div>
      </div>
      {children}
    </div>
  )
}
