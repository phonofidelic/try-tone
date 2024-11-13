import { useEffect, useRef } from 'react'

export function useStopTouchmovePropagation() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!inputRef.current) {
      return
    }
    const inputElement = inputRef.current
    const onTouchMove = (event: TouchEvent) => {
      event.stopImmediatePropagation()
    }
    inputElement.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      inputElement.removeEventListener('touchmove', onTouchMove)
    }
  }, [inputRef])

  return inputRef
}
