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

  const onMouseUp = (event: React.MouseEvent) => {
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
            x: event.clientX * scale - offset.x,
            y: event.clientY * scale - offset.y,
          },
        }),
      )
    } else {
      // write position to localStorage
      localStorage.setItem(
        'tilePositions',
        JSON.stringify({
          [id]: {
            x: event.clientX * scale - offset.x,
            y: event.clientY * scale - offset.y,
          },
        }),
      )
    }

    setIsPressed(false)
    setOffset({ x: 0, y: 0 })
  }

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
    // const onMouseUp = (event: MouseEvent) => {
    //   // get current positions state
    //   const currentPositionsString = localStorage.getItem('tilePositions')
    //   if (currentPositionsString) {
    //     const currentPositions = JSON.parse(currentPositionsString) as {
    //       [key: string]: { x: string; y: string }
    //     }

    //     // write position to localStorage
    //     localStorage.setItem(
    //       'tilePositions',
    //       JSON.stringify({
    //         ...currentPositions,
    //         [id]: {
    //           x: event.clientX * scale,
    //           y: event.clientY * scale,
    //         },
    //       }),
    //     )
    //   } else {
    //     // write position to localStorage
    //     localStorage.setItem(
    //       'tilePositions',
    //       JSON.stringify({
    //         [id]: {
    //           x: event.clientX * scale,
    //           y: event.clientY * scale,
    //         },
    //       }),
    //     )
    //   }

    //   setIsPressed(false)
    //   setOffset({ x: 0, y: 0 })
    // }

    document.addEventListener('mousemove', onMouseMove)
    // document.addEventListener('mouseup', onMouseUp)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      // document.removeEventListener('mouseup', onMouseUp)
    }
  }, [id, isPressed, offset, scale])

  return (
    <div
      ref={containerRef}
      className={clsx(
        'absolute group cursor-pointer bg-white dark:bg-zinc-800 transition-opacity duration-500 rounded p-2',
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
      {/* <div className="relative">
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
          // onMouseUp={(event) =>
          //   editModule(children.props.moduleData.id, { position: pos })
          // }
        >
          <div className="size-full  group-hover:border-2 border-slate-300 dark:border-zinc-500 rounded  border-dashed"></div>
        </div>
      </div> */}
      <div
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
      >
        <h2 className="text-2xl">{header}</h2>
      </div>
      {children}
    </div>
  )
}
