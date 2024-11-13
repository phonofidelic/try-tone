import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

export default function Tile({
  id,
  initialPos,
  scale,
  header,
  children,
}: {
  id: string
  initialPos: { x: number; y: number }
  scale: number
  header: React.ReactNode
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
        return {
          x: Number(storedPosition.x),
          y: Number(storedPosition.y),
        }
      }
    }
    // else use initialPos
    return initialPos
  })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPressed, setIsPressed] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<HTMLDivElement | null>(null)
  const initialized = useRef(false)

  const updatePosition = (gesture: { x: number; y: number }) => {
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
  }

  const onMouseUp = (event: React.MouseEvent) => {
    updatePosition({ x: event.clientX, y: event.clientY })
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    updatePosition({
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    })
  }

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
    if (!containerRef.current || !handleRef.current) {
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

    const onTouchMove = (event: TouchEvent) => {
      if (!isPressed || !containerRef.current) {
        return
      }
      event.preventDefault()
      event.stopPropagation()

      const touch = event.touches[0]
      setPos({
        x: touch.clientX * scale - offset.x,
        y: touch.clientY * scale - offset.y,
      })
    }

    const handleDiv = handleRef.current

    document.addEventListener('mousemove', onMouseMove)
    handleDiv.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      handleDiv.removeEventListener('touchmove', onTouchMove)
    }
  }, [id, isPressed, offset, scale])

  return (
    <div
      ref={containerRef}
      className={clsx(
        'absolute group cursor-pointer bg-white dark:bg-zinc-800 transition-opacity duration-500 rounded p-2',
        {
          'md:drop-shadow': !isPressed,
          'md:drop-shadow-lg': isPressed,
          'opacity-0': !initialized.current,
          'opacity-100': initialized.current,
        },
      )}
      style={{
        left: pos.x,
        top: pos.y,
      }}
    >
      <div
        ref={handleRef}
        className="size-full  border-2 border-white hover:border-slate-300 hover:dark:border-zinc-500 rounded  border-dashed p-2"
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
        onMouseUp={onMouseUp}
        onTouchStart={(event) => {
          if (!containerRef.current) {
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
        onTouchEnd={onTouchEnd}
      >
        <h2 className="text-2xl">{header}</h2>
      </div>
      {children}
    </div>
  )
}
