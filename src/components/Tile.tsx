import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

export default function Tile({
  initialPos,
  children,
}: {
  initialPos?: { x: number; y: number }
  children: React.ReactNode
}) {
  const [pos, setPos] = useState(initialPos ?? { x: 200, y: 200 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!isPressed || !containerRef.current) {
        return
      }

      setPos({
        x: event.clientX - offset.x,
        y: event.clientY - offset.y,
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
  }, [isPressed, offset])

  return (
    <div
      ref={containerRef}
      className={clsx(
        'absolute group cursor-pointer bg-white dark:bg-zinc-800',
        {
          'drop-shadow': !isPressed,
          'drop-shadow-lg': isPressed,
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
              x: event.pageX - containerRef.current.offsetLeft,
              y: event.pageY - containerRef.current.offsetTop,
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
