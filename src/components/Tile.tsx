import { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { HP_1, U_1 } from '@/constants'
import { snap } from '@/utils'

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
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const updatePosition = useCallback(
    (gesture: { x: number; y: number }) => {
      console.log(gesture)
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
            [id]: {
              x: gesture.x * scale - offset.x,
              y: gesture.y * scale - offset.y,
            },
          }),
        )
      } else {
        // write position to localStorage
        localStorage.setItem(
          'tilePositions',
          JSON.stringify({
            [id]: {
              x: gesture.x * scale - offset.x,
              y: gesture.y * scale - offset.y,
            },
          }),
        )
      }

      setIsPressed(false)
      setOffset({ x: 0, y: 0 })
    },
    [id, offset.x, offset.y, scale],
  )

  const [position, setPosition] = useState(() => {
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
      // else use initialPos and set to localStorage
      localStorage.setItem(
        'tilePositions',
        JSON.stringify({
          ...tilePositions,
          [id]: snap(initialPos),
        }),
      )
      return snap(initialPos)
    }
    // else use initialPos and set to localStorage
    localStorage.setItem(
      'tilePositions',
      JSON.stringify({
        [id]: snap(initialPos),
      }),
    )
    return snap(initialPos)
  })

  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || !handleRef.current) {
      return
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!isPressed || !containerRef.current) {
        return
      }

      setPosition(
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
      setPosition(
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

      updatePosition({ x: event.clientX, y: event.clientY })
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
        'absolute group bg-zinc-300 dark:bg-zinc-800 transition-opacity duration-500 rounded p-2',
        {
          'md:drop-shadow': !isPressed,
          'md:drop-shadow-lg': isPressed,
        },
      )}
      style={{
        left: position.x,
        top: position.y,
        height: size?.u ?? U_1 * 3,
        width: size?.hp ?? HP_1 * 12,
      }}
    >
      <div
        ref={handleRef}
        className={clsx(
          'border-2 border-white hover:border-slate-300 hover:dark:border-zinc-500 rounded border-dashed p-2',
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
          setOffset({
            x: event.clientX * scale - containerRef.current.offsetLeft,
            y: event.clientY * scale - containerRef.current.offsetTop,
          })
        }}
        onTouchStart={(event) => {
          if (!containerRef.current || event.touches.length > 1) {
            return
          }
          setIsPressed(true)
          setOffset({
            x:
              event.touches[0].clientX * scale -
              containerRef.current.offsetLeft,
            y:
              event.touches[0].clientY * scale - containerRef.current.offsetTop,
          })
        }}
        onTouchEnd={(event: React.TouchEvent) => {
          if (event.touches.length > 1) {
            return
          }
          updatePosition({
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY,
          })
        }}
      >
        <h2 className="text-2xl">{header}</h2>
      </div>
      {children}
    </div>
  )
}
