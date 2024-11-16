import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { DestinationSelect } from './DestinationSelect'
import { ModuleData, useWorkspace } from './Workspace'
import { useAudioNode, type ModuleNode } from '../AudioNodeContext'

const frequencyRange = {
  oscillator: {
    min: 20,
    max: 16000,
    step: 0.01,
  },
  lfo: {
    min: 0.1,
    max: 10,
    step: 0.01,
  },
}

export function Oscillator({
  moduleData,
}: {
  moduleData: ModuleData<'oscillator' | 'lfo'>
}) {
  const { id } = moduleData
  const [displayState, setDisplayState] = useState<'started' | 'stopped'>(
    'stopped',
  )
  const { modules, editModule, removeModule } = useWorkspace()
  const { node, getNode } = useAudioNode<'oscillator' | 'lfo'>(moduleData)

  if (!node) {
    return null
  }

  const onFrequencyChange = async (value: number) => {
    editModule<'oscillator' | 'lfo'>(id, {
      settings: { ...moduleData.settings, frequency: value },
    })
    node.frequency.rampTo(Tone.Frequency(value).toFrequency(), 0)
  }

  const onTypeChange = (value: Tone.ToneOscillatorType) => {
    editModule<'oscillator' | 'lfo'>(id, {
      settings: { ...moduleData.settings, type: value },
    })
    node.type = value
  }

  const onTogglePlay = () => {
    if (displayState === 'stopped') {
      node.start()
      setDisplayState('started')
    } else {
      node.stop()
      setDisplayState('stopped')
    }
  }

  const onConnect = (destinationId: string) => {
    node.disconnect()
    if (destinationId === 'out') {
      node.toDestination()
    } else {
      const destinationNode = getNode(destinationId)
      console.log('destinationNode:', destinationNode)
      if (destinationNode) {
        if (moduleData.type === 'lfo' && destinationNode.type === 'filter') {
          node.connect(destinationNode.data.frequency)
        } else {
          node.connect(destinationNode.data)
        }
      }
    }
    editModule(id, { destinations: [destinationId] })
  }

  const handleRemove = (id: string) => {
    node.disconnect()
    node.dispose()
    removeModule(id)
  }

  return (
    <div className="flex gap-y-2 flex-col justify-between h-[calc(100%-52px)] p-2">
      {moduleData.type === 'lfo' && (
        <div className="flex justify-center w-full p-4">
          <LedIndicator isRunning={displayState === 'started'} node={node} />
        </div>
      )}
      <div className="flex w-full justify-center">
        <KnobInput
          label="Frequency"
          min={frequencyRange[moduleData.type].min}
          max={frequencyRange[moduleData.type].max}
          step={frequencyRange[moduleData.type].step}
          units={['Hz', 'kHz']}
          onChange={onFrequencyChange}
        />
      </div>
      <OscillatorTypeSelect
        initialValue={moduleData.settings.type}
        onChange={onTypeChange}
      />
      <div className="flex gap-x-2 w-full">
        <button className="w-full" onClick={onTogglePlay}>
          {displayState === 'stopped' ? 'Start' : 'Stop'}
        </button>
        <button className="w-full" onClick={() => handleRemove(id)}>
          Remove
        </button>
      </div>
      <div className="flex gap-x-2 w-full">
        <DestinationSelect
          className="w-full"
          destinations={modules.filter((module) => module.id !== id)}
          initialValue={moduleData.destinations[0] ?? 'not_set'}
          onChange={onConnect}
        />
      </div>
    </div>
  )
}

function KnobInput({
  min,
  max,
  step,
  label,
  units,
  onChange,
}: {
  min: number
  max: number
  step: number
  label: string
  units?: string[]
  onChange: (value: number) => void
}) {
  const ROTATION_MAX_PERCENT = 80
  // TODO: make this dynamic based user settings
  const SENSITIVITY = { mouse: 0.3, touch: 0.03 }
  const [value, setValue] = useState(min)
  const [rotationDegrees, setRotationDegrees] = useState(0)
  const [clickOrigin, setClickOrigin] = useState<{
    x: number
    y: number
  } | null>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const rotationDelta = useRef(0)
  const precision = getPrecision(step)
  const movementDeltaY = useRef(0)

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setClickOrigin({ x: event.clientX, y: event.clientY })
  }

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
      onChange(newValue)
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
    }

    const onTouchEnd = () => {
      setClickOrigin(null)
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove)
    knobElement.addEventListener('touchmove', onTouchMove)
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
    <label className="flex flex-col relative gap-2">
      <div className="flex justify-center w-full gap-x-1 dark:text-white">
        {label}:{' '}
        <div
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
      <div className="w-full flex justify-center">
        <div className="drop-shadow-[2px_2px_5px_rgba(0,0,0,0.5)]">
          <div
            ref={knobRef}
            className="size-[80px] bg-[url(/knob.png)] rounded-full bg-center cursor-pointer"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
            }}
            onMouseDown={onMouseDown}
            onTouchStart={(event) => {
              setClickOrigin({
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
              })
            }}
          />
        </div>
      </div>
      <input
        className="invisible"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
    </label>
  )
}

function OscillatorTypeSelect({
  initialValue,
  onChange,
}: {
  initialValue: Tone.ToneOscillatorType
  onChange: (value: Tone.ToneOscillatorType) => void
}) {
  return (
    <select
      aria-label="shape"
      name="shape"
      defaultValue={initialValue}
      onChange={(event) =>
        onChange(event.target.value as Tone.ToneOscillatorType)
      }
    >
      <option value="sine">Sine</option>
      <option value="triangle">Triangle</option>
      <option value="sawtooth">Sawtooth</option>
      <option value="square">Square</option>
    </select>
  )
}

function LedIndicator({
  node,
  isRunning,
}: {
  node: ModuleNode<'oscillator' | 'lfo' | 'filter'>['data']
  isRunning: boolean
}) {
  const [indicatorValue, setOutputValue] = useState<number>(0)
  const intervalId = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!node || !isRunning) {
      if (intervalId.current) {
        clearInterval(intervalId.current)
      }
      return
    }

    const analyser = new Tone.Analyser('waveform', 1024)
    node.connect(analyser)

    const updateOutputValue = () => {
      const analyserData = Array.from(analyser.getValue() as Float32Array)
      const sum = analyserData.reduce((a, b) => a + b, 0)
      const average = sum / analyserData.length
      setOutputValue(average)
    }

    intervalId.current = setInterval(updateOutputValue, 100)

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current)
      }
      analyser.disconnect()
    }
  }, [node, isRunning])
  return (
    <div className="flex relative size-4">
      <div
        className="size-full m-auto rounded-full absolute border-2"
        style={{
          backgroundColor: `rgb(${Math.max(indicatorValue * 100, 50) + 85}, 0, 0)`,
          borderColor: `rgb(${Math.max(indicatorValue * 100, 50)}, 50, 50)`,
        }}
      />
      <div
        className="size-full m-auto rounded-full bg-red-500 blur-md absolute"
        style={{ opacity: indicatorValue }}
      />
    </div>
  )
}

const clamp = (num: number, min: number, max: number) => {
  return Math.min(Math.max(num, min), max)
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
