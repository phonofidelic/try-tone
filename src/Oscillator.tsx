import { createContext, useRef, useState } from 'react'
import * as Tone from 'tone'

const OscillatorContext = createContext<Tone.Oscillator | null>(null)

export function Oscillator({
  id,
  name,
  onRemove,
}: {
  id: string
  name: string
  onRemove: (name: string) => void
}) {
  const INITIAL_FREQUENCY = 440
  const INITIAL_TYPE = 'sine'
  const oscillator = useRef(
    new Tone.Oscillator(INITIAL_FREQUENCY, INITIAL_TYPE).toDestination(),
  )

  const [frequency, setFrequency] = useState(INITIAL_FREQUENCY)
  const [displayState, setDisplayState] = useState<'started' | 'stopped'>(
    'stopped',
  )

  if (!oscillator.current) {
    return null
  }

  const onFrequencyChange = (value: number) => {
    setFrequency(value)
    oscillator.current.frequency.rampTo(Tone.Frequency(value).toFrequency(), 0)
  }

  const onTypeChange = (value: Tone.ToneOscillatorType) => {
    oscillator.current.type = value
  }

  const onTogglePlay = () => {
    if (displayState === 'stopped') {
      oscillator.current.start()
      setDisplayState('started')
    } else {
      oscillator.current.stop()
      setDisplayState('stopped')
    }
  }

  return (
    <OscillatorContext.Provider value={oscillator.current}>
      <div className="flex flex-col space-y-2 border rounded p-2">
        <div>
          <h2 className="text-2xl">{name}</h2>
        </div>
        <div>
          <FrequencyDisplay value={frequency} />
          <FrequencyControl onChange={onFrequencyChange} />
          <div>
            Shape: <OscillatorTypeSelect onChange={onTypeChange} />
          </div>
          <div>
            <button onClick={onTogglePlay}>
              {displayState === 'stopped' ? 'Start' : 'Stop'}
            </button>
            <button onClick={() => onRemove(id)}>Remove</button>
          </div>
        </div>
      </div>
    </OscillatorContext.Provider>
  )
}

function FrequencyDisplay({ value }: { value: number }) {
  return <div>Frequency: {Math.round(value)} Hz</div>
}

function FrequencyControl({ onChange }: { onChange: (value: number) => void }) {
  return (
    <input
      type="range"
      min={20}
      max={20000}
      onChange={(event) => {
        onChange(Tone.Frequency(event.target.value).toFrequency())
      }}
    />
  )
}

function OscillatorTypeSelect({
  onChange,
}: {
  onChange: (value: Tone.ToneOscillatorType) => void
}) {
  return (
    <select
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
