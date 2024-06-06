import { useState } from 'react'
import * as Tone from 'tone'
import { useVoice } from './App'

export function Oscillator({
  id,
  name,
  node,
  onRemove,
}: {
  id: string
  name: string
  node: Tone.Oscillator
  onRemove: (id: string) => void
}) {
  const [frequency, setFrequency] = useState(440)
  const [displayState, setDisplayState] = useState<'started' | 'stopped'>(
    'stopped',
  )

  const { vcas, mixer, envelopes } = useVoice()
  const destinations = [...vcas, ...envelopes, mixer]

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

  const onDestinationChange = (destinationId: string) => {
    if (destinationId === 'not_set') {
      node.disconnect()
      return
    }

    if (destinationId === 'out') {
      node.disconnect()
      node.toDestination()
      return
    }

    const destinationNode = destinations.find(
      (destination) => destination.id === destinationId,
    )?.node

    if (!destinationNode) {
      throw new Error('Destination node not found')
    }

    node.disconnect()
    node.connect(destinationNode)
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
          <div>
            <DestinationSelect
              destinations={destinations}
              onChange={onDestinationChange}
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

function DestinationSelect({
  destinations,
  onChange,
}: {
  destinations: { id: string; name: string; node: Tone.OutputNode }[]
  onChange: (value: string) => void
}) {
  return (
    <select onChange={(event) => onChange(event.target.value)}>
      <option value={'not_set'}>Select a destination</option>
      {destinations.map((destination) => (
        <option key={destination.id} value={destination.id}>
          {destination.name}
        </option>
      ))}
      <option value={'out'}>Out</option>
    </select>
  )
}
