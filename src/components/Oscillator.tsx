import { useState } from 'react'
import * as Tone from 'tone'
import { useVoice } from '../App'
import { DestinationSelect } from './DestinationSelect'

export function Oscillator({
  id,
  name,
  node,
  onRemove,
  onConnect,
}: {
  id: string
  name: string
  node: Tone.Oscillator
  onRemove: (id: string) => void
  onConnect: (destinationId: string) => void
}) {
  const [frequency, setFrequency] = useState(440)
  const [displayState, setDisplayState] = useState<'started' | 'stopped'>(
    'stopped',
  )

  const { nodes } = useVoice()

  const onFrequencyChange = (value: number) => {
    setFrequency(value)
    node.frequency.rampTo(Tone.Frequency(value).toFrequency(), 0)
  }

  const onTypeChange = (value: Tone.ToneOscillatorType) => {
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

  const handleRemove = (id: string) => {
    node.disconnect()
    node.dispose()
    onRemove(id)
  }

  return (
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
        <div className="flex space-x-2 w-full">
          <button className="w-full" onClick={onTogglePlay}>
            {displayState === 'stopped' ? 'Start' : 'Stop'}
          </button>
          <button className="w-full" onClick={() => handleRemove(id)}>
            Remove
          </button>
        </div>
        <div>
          Destination:
          <div className="flex flex-col space-y-2">
            <DestinationSelect
              destinations={nodes.filter((node) => node.id !== id)}
              initialValue={'not_set'}
              onChange={onConnect}
            />
          </div>
        </div>
      </div>
    </div>
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