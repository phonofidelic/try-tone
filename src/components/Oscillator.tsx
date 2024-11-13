import { useState } from 'react'
import * as Tone from 'tone'
import { DestinationSelect } from './DestinationSelect'
import { ModuleData, useWorkspace } from './Workspace'
import { useAudioNode } from '../AudioNodeContext'
import { useStopTouchmovePropagation } from '@/hooks'

export function Oscillator({
  moduleData,
}: {
  moduleData: ModuleData<'oscillator'>
}) {
  const { id } = moduleData
  const [frequency, setFrequency] = useState(moduleData.settings.frequency)
  const [displayState, setDisplayState] = useState<'started' | 'stopped'>(
    'stopped',
  )
  const { modules, editModule, removeModule } = useWorkspace()
  const { node, getNode } = useAudioNode<'oscillator'>(moduleData)

  if (!node) {
    return null
  }

  const onFrequencyChange = async (value: number) => {
    setFrequency(value)
    editModule<'oscillator'>(id, {
      settings: { ...moduleData.settings, frequency: value },
    })
    node.frequency.rampTo(Tone.Frequency(value).toFrequency(), 0)
  }

  const onTypeChange = (value: Tone.ToneOscillatorType) => {
    editModule<'oscillator'>(id, {
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
        node.connect(destinationNode.data)
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
    <div className="flex space-y-2 flex-col p-2">
      <FrequencyDisplay value={frequency} />
      <FrequencyControl
        value={moduleData.settings.frequency}
        onChange={onFrequencyChange}
      />
      <OscillatorTypeSelect
        initialValue={moduleData.settings.type}
        onChange={onTypeChange}
      />
      <div className="flex space-x-2 w-full">
        <button className="w-full" onClick={onTogglePlay}>
          {displayState === 'stopped' ? 'Start' : 'Stop'}
        </button>
        <button className="w-full" onClick={() => handleRemove(id)}>
          Remove
        </button>
      </div>
      <DestinationSelect
        destinations={modules.filter((module) => module.id !== id)}
        initialValue={moduleData.destinations[0] ?? 'not_set'}
        onChange={onConnect}
      />
    </div>
  )
}

function FrequencyDisplay({ value }: { value: number }) {
  return <div>Frequency: {Math.round(value)} Hz</div>
}

function FrequencyControl({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const inputRef = useStopTouchmovePropagation()

  return (
    <input
      ref={inputRef}
      aria-label="frequency"
      type="range"
      min={20}
      max={20000}
      value={value}
      onChange={(event) => {
        onChange(Tone.Frequency(event.target.value).toFrequency())
      }}
    />
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
