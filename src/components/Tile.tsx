import { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { HP_1, U_1 } from '@/constants'

export default function Tile({
  id,
  initialPos,
  scale,
  header,
  size,
  children,
}: {
  id: string
  initialPos: { x: number; y: number }
  scale: number
  header: React.ReactNode
  size: { u: number; hp: number }
  children: React.ReactNode
}) {
  const [pos, setPos] = useState(() => {
    // read initial position from localStorage if found
    const tilePositionsString = localStorage.getItem('tilePositions')
    if (tilePositionsString) {
      const tilePositions = JSON.parse(tilePositionsString) as {
        [key: string]: { x: string; y: string }
      }
      const storedPosition = tilePositions[id]

      if (storedPosition) {
        return snap({
          x: Number(storedPosition.x),
          y: Number(storedPosition.y),
        })
      }
    }
    // else use initialPos
    return snap(initialPos)
  })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<HTMLDivElement | null>(null)

  const updatePosition = useCallback(
    (gesture: { x: number; y: number }) => {
      // get current positions state
      const currentPositionsString = localStorage.getItem('tilePositions')
      if (currentPositionsString) {
        const currentPositions = JSON.parse(currentPositionsString) as {
          [key: string]: { x: string; y: string }
        }

        // write position to localStorage
        localStorage.setItem(
          'tilePositions',
          JSON.stringify({
            ...currentPositions,
            [id]: snap({
              x: gesture.x * scale - offset.x,
              y: gesture.y * scale - offset.y,
            }),
          }),
        )
      } else {
        // write position to localStorage
        localStorage.setItem(
          'tilePositions',
          JSON.stringify({
            [id]: snap({
              x: gesture.x * scale - offset.x,
              y: gesture.y * scale - offset.y,
            }),
          }),
        )
      }

      setIsPressed(false)
      setOffset({ x: 0, y: 0 })
    },
    [id, offset.x, offset.y, scale],
  )

  useEffect(() => {
    if (!containerRef.current || !handleRef.current) {
      return
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!isPressed || !containerRef.current) {
        return
      }

      setPos(
        snap({
          x: event.clientX * scale - offset.x,
          y: event.clientY * scale - offset.y,
        }),
      )
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!isPressed || !containerRef.current) {
        return
      }
      event.preventDefault()
      event.stopPropagation()

      if (event.touches.length > 1) {
        return
      }

      const touch = event.touches[0]
      setPos(
        snap({
          x: touch.clientX * scale - offset.x,
          y: touch.clientY * scale - offset.y,
        }),
      )
    }

    const onMouseUp = (event: MouseEvent) => {
      if (!isPressed || !containerRef.current) {
        return
      }

      updatePosition(snap({ x: event.clientX, y: event.clientY }))
      setIsPressed(false)
    }

    const handleDiv = handleRef.current

    document.addEventListener('mousemove', onMouseMove)
    handleDiv.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      handleDiv.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [id, isPressed, offset, scale, updatePosition])

  return (
    <div
      ref={containerRef}
      className={clsx(
        'absolute group bg-white dark:bg-zinc-800 transition-opacity duration-500 rounded p-2',
        {
          'md:drop-shadow': !isPressed,
          'md:drop-shadow-lg': isPressed,
        },
      )}
      style={{
        left: pos.x,
        top: pos.y,
        height: size?.u ?? U_1 * 3,
        width: size?.hp ?? HP_1 * 12,
      }}
    >
      <div
        ref={handleRef}
        className={clsx(
          'border-2 border-white hover:border-slate-300 hover:dark:border-zinc-500 rounded  border-dashed p-2',
          {
            'cursor-grabbing': isPressed,
            'cursor-grab': !isPressed,
          },
        )}
        onMouseDown={(event) => {
          if (!containerRef.current) {
            return
          }
          setIsPressed(true)
          setOffset(
            snap({
              x: event.clientX * scale - containerRef.current.offsetLeft,
              y: event.clientY * scale - containerRef.current.offsetTop,
            }),
          )
        }}
        onTouchStart={(event) => {
          if (!containerRef.current || event.touches.length > 1) {
            return
          }
          setIsPressed(true)
          setOffset(
            snap({
              x:
                event.touches[0].clientX * scale -
                containerRef.current.offsetLeft,
              y:
                event.touches[0].clientY * scale -
                containerRef.current.offsetTop,
            }),
          )
        }}
        onTouchEnd={(event: React.TouchEvent) => {
          if (event.touches.length > 1) {
            return
          }
          updatePosition(
            snap({
              x: event.changedTouches[0].clientX,
              y: event.changedTouches[0].clientY,
            }),
          )
        }}
      >
        <h2 className="text-2xl">{header}</h2>
      </div>
      {children}
    </div>
  )
}

function snap({ x, y }: { x: number; y: number }) {
  // return { x, y }
  return {
    x: Math.round(x / HP_1) * HP_1,
    y: Math.round(y / (U_1 * 3)) * U_1 * 3,
  }
}
