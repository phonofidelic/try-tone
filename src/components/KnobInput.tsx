import { useState, useRef, useEffect } from 'react'
import { clamp } from '@/utils'

export function KnobInput({
  moduleId,
  initialValue,
  min,
  max,
  step,
  label,
  units,
  onChange,
}: {
  moduleId: string
  initialValue?: number
  min: number
  max: number
  step: number
  label: string
  units?: string[]
  onChange: (value: number) => void
}) {
  const ROTATION_MAX_PERCENT = 80
  const ROTATION_MAX_DEGREES = ROTATION_MAX_PERCENT * (360 / 100)
  // TODO: make this dynamic based user settings
  const SENSITIVITY = { mouse: 0.3, touch: 0.03 }
  const precision = getPrecision(step)

  const [value, setValue] = useState(initialValue ?? min)
  const [rotationDegrees, setRotationDegrees] = useState(0)
  const [clickOrigin, setClickOrigin] = useState<{
    x: number
    y: number
  } | null>(null)

  // TODO: get scale and offset from WorkspaceContext
  // const [cursorPosition, setCursorPosition] = useState<{
  //   x: number
  //   y: number
  // } | null>(null)

  const knobRef = useRef<HTMLButtonElement>(null)
  const rotationDelta = useRef(0)
  const movementDeltaY = useRef(0)
  const isKnobChange = useRef(false)
  const keydownStart = useRef<number | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialValue && !initialized.current) {
      const newRotationPercent = clamp(initialValue / max, 0, 360 / 100)
      const newRotationDegrees = clamp(
        newRotationPercent * ROTATION_MAX_DEGREES,
        0,
        ROTATION_MAX_DEGREES,
      )

      rotationDelta.current = newRotationPercent * -1 * ROTATION_MAX_PERCENT
      setRotationDegrees(newRotationDegrees)

      initialized.current = true
    }
  }, [initialValue, min, max, precision, ROTATION_MAX_DEGREES])

  useEffect(() => {
    if (!knobRef.current) {
      return
    }

    const knobElement = knobRef.current

    const rotate = (delta: number) => {
      const newRotationDegrees = (clamp(delta, 0, 360) / 100) * 360
      const range = max - min
      const newRotationPercent =
        newRotationDegrees / ((ROTATION_MAX_PERCENT / 100) * 360)

      const newValue = clamp(newRotationPercent * range + min, min, max)
      const roundedNewValue =
        Math.round((newValue + Number.EPSILON) * Math.pow(10, precision ?? 2)) /
        Math.pow(10, precision ?? 2)

      setRotationDegrees(newRotationDegrees)
      setValue(roundedNewValue)
      if (isKnobChange.current) {
        onChange(newValue)
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      if (clickOrigin) {
        movementDeltaY.current += event.movementY
        const newRotationDelta = clamp(
          rotationDelta.current + movementDeltaY.current * SENSITIVITY.mouse,
          -ROTATION_MAX_PERCENT,
          0,
        )
        rotate(newRotationDelta * -1)
        rotationDelta.current = newRotationDelta
        movementDeltaY.current = 0
        // TODO: get scale and offset from WorkspaceContext
        // setCursorPosition(
        //   translateCoordinates(
        //     { x: event.clientX, y: event.clientY },
        //     { x: screenOffset.x - 16, y: screenOffset.y - 16 },
        //   ),
        // )
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      event.stopPropagation()

      if (clickOrigin) {
        // TODO: improve touch interactions
        const { y } = clickOrigin
        const deltaY = event.touches[0].clientY - y
        const newRotationDelta = clamp(
          rotationDelta.current + deltaY * SENSITIVITY.touch,
          -ROTATION_MAX_PERCENT,
          0,
        )
        rotate(newRotationDelta * -1)
        rotationDelta.current = newRotationDelta
      }
    }

    const onMouseUp = () => {
      setClickOrigin(null)
      // TODO: get scale and offset from WorkspaceContext
      // setCursorPosition(null)
    }

    const onTouchEnd = () => {
      setClickOrigin(null)
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove)
    knobElement.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
      knobElement.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [
    SENSITIVITY.mouse,
    SENSITIVITY.touch,
    clickOrigin,
    max,
    min,
    onChange,
    precision,
    step,
  ])

  return (
    <label className="flex flex-col relative gap-2 pt-10 w-full items-center">
      {/* TODO: get scale and offset from WorkspaceContext */}
      {/* {cursorPosition && (
        <div
          key={`value-indicator_${moduleId}`}
          className="fixed z-50"
          style={{
            top: `${cursorPosition.y}px`,
            left: `${cursorPosition.x}px`,
            transform: `none`,
          }}
        >
          <div className="flex justify-center w-full gap-x-1 dark:text-white">
            <div className="bg-white dark:bg-zinc-900 p-1 text-sm rounded-sm">
              {units?.length
                ? value > 999 && units.length === 2
                  ? `${Math.trunc(value / 1000)}\u00A0${units[1]}`
                  : `${roundToPrecision(value, precision)}\u00A0${units[0]}`
                : value}
            </div>
          </div>
        </div>
      )} */}
      <div className="w-full flex justify-center z-10">
        <div className="drop-shadow-[2px_2px_5px_rgba(0,0,0,0.5)]">
          <button
            ref={knobRef}
            className="size-[80px] bg-[url(/knob.png)] rounded-full bg-center cursor-pointer"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
            }}
            onMouseDown={(event) => {
              isKnobChange.current = true
              setClickOrigin({ x: event.clientX, y: event.clientY })
            }}
            onTouchStart={(event) => {
              setClickOrigin({
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
              })
            }}
            onKeyDown={(event) => {
              isKnobChange.current = false
              if (
                !['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft'].includes(
                  event.key,
                )
              ) {
                return
              }
              if (keydownStart.current === null) {
                keydownStart.current = event.timeStamp
              }
              const delta = event.timeStamp - keydownStart.current
              const newValue = ['ArrowUp', 'ArrowRight'].includes(event.key)
                ? clamp(value + clamp(delta * step, 0, max), min, max)
                : clamp(value - clamp(delta * step, 0, max), min, max)

              if (newValue < min || newValue > max) {
                keydownStart.current = null
                return
              }

              const newRotationDegrees =
                (Number(newValue) / max) * ROTATION_MAX_DEGREES
              setRotationDegrees(
                clamp(newRotationDegrees, 0, ROTATION_MAX_DEGREES),
              )
              setValue(Number(newValue))
              onChange(Number(newValue))
            }}
            onKeyUp={() => {
              keydownStart.current = null
            }}
          />
        </div>
      </div>
      <div className="p-4 top-0 flex justify-center w-full gap-x-1 first:gap-x-0 dark:text-white">
        {label}
        <span className="-ml-1 md:hidden">:</span>
        <div
          className="md:hidden"
          style={{
            width: `${(precision + (precision === 1 ? 0.5 : 0)) * 4 * 4}px`,
          }}
        >
          {units?.length
            ? value > 999 && units.length === 2
              ? `${Math.trunc(value / 1000)}\u00A0${units[1]}`
              : `${roundToPrecision(value, precision)}\u00A0${units[0]}`
            : value}
        </div>
      </div>
      <div className="absolute flex size-[80px]">
        <div className="z-0 m-auto relative flex size-[22px] justify-center items-middle group text-xs dark:text-white border">
          <div className="absolute -bottom-[48px] -left-[42px]">
            {getValueInUnitsString(min, units, precision)}
          </div>
          <div className="absolute -top-[16px] -left-[72px]">
            {getValueInUnitsString(max * 0.25, units, precision)}
          </div>
          <div className="absolute -top-[54px]">
            {getValueInUnitsString(max * 0.5, units, precision)}
          </div>
          <div className="absolute -top-[16px] -right-[74px]">
            {getValueInUnitsString(max * 0.75, units, precision)}
          </div>
          <div className="absolute -bottom-[48px] left-[32px]">
            {getValueInUnitsString(max, units, precision)}
          </div>
        </div>
      </div>
      <div className="absolute flex w-full mx-auto -z-10">
        <datalist id={`values_${moduleId}`}>
          <option
            value={min}
            label={getValueInUnitsString(min, units, precision)} //
          ></option>
          <option
            value={max * 0.25}
            label={getValueInUnitsString(max * 0.25, units, precision)}
          ></option>
          <option
            value={max * 0.5}
            label={getValueInUnitsString(max * 0.5, units, precision)} //
          ></option>
          <option
            value={max * 0.75}
            label={getValueInUnitsString(max * 0.75, units, precision)}
          ></option>
          <option
            value={max}
            label={getValueInUnitsString(max, units, precision)} //
          ></option>
        </datalist>
      </div>
      <input
        className="w-full invisible"
        type="range"
        min={min}
        max={max}
        step={step}
        value={initialValue ?? value}
        onChange={(event) => {
          isKnobChange.current = false
          const newRotationDegrees =
            (Number(event.target.value) / max) * ROTATION_MAX_DEGREES
          setRotationDegrees(newRotationDegrees)
          setValue(Number(event.target.value))
          onChange(Number(event.target.value))
        }}
        list={`values_${moduleId}`}
      />
    </label>
  )
}

const getPrecision = (a: number) => {
  if (!isFinite(a)) return 0
  let e = 1,
    p = 0
  while (Math.round(a * e) / e !== a) {
    e *= 10
    p++
  }
  return p
}

const roundToPrecision = (num: number, precision: number) => {
  10 ** precision * num
  return Math.round(10 ** precision * num) / 10 ** precision
}

const getValueInUnitsString = (
  value: number,
  units: string[] | undefined,
  precision: number,
) => {
  return units?.length
    ? value > 999 && units.length === 2
      ? `${Math.trunc(value / 1000)}\u00A0${units[1]}`
      : `${roundToPrecision(value, precision)}\u00A0${units[0]}`
    : `${value}`
}
