import { useState, useRef, useEffect } from 'react'
import { translateCoordinates } from '@/utils'

export function CursorDebug({
  scale,
  offset,
}: {
  scale: number
  offset: { x: number; y: number }
}) {
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 })
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }
    const containerDiv = containerRef.current
    setContainerWidth(containerDiv.getBoundingClientRect().width)
  }, [])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      setCoordinates({
        x: event.clientX,
        y: event.clientY,
      })
    }

    document.addEventListener('mousemove', onMouseMove)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed z-10 top-0 left-0 border border-green-400 text-xs rounded bg-white dark:bg-zinc-800 p-2 opacity-75 text-green-500"
      style={{
        transform: getTransform(
          translateCoordinates(coordinates, { x: containerWidth + 16, y: -16 }),
        ),
      }}
    >
      <div>clientX: {coordinates.x}</div>
      <div>clientY: {coordinates.y}</div>
      <div>scale: {roundToPrecision(scale, 100)}</div>
      <div>
        <div>offset x: {roundToPrecision(offset.x, 100)}</div>
        <div>offset y: {roundToPrecision(offset.y, 100)}</div>
      </div>
      <div>
        <div>translated x: {translateCoordinates(coordinates, offset).x}</div>
        <div>translated y: {translateCoordinates(coordinates, offset).y}</div>
      </div>
    </div>
  )
}

const roundToPrecision = (value: number, precision: number) =>
  Math.round((value + Number.EPSILON) * precision) / precision

const getTransform = ({ x, y }: { x: number; y: number }) =>
  `translate(${x}px, ${y}px)`
