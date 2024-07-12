import * as Tone from 'tone'
import { DestinationSelect } from './DestinationSelect'
import { ModuleData, useWorkspace } from './Workspace'
import { useEffect, useState } from 'react'
import { useAudioNode } from '../AudioNodeContext'

export default function Filter({
  moduleData,
}: {
  moduleData: ModuleData<'filter'>
}) {
  const { id } = moduleData
  const [frequency, setFrequency] = useState(20)
  const [frequencyType, setFrequencyType] = useState('bandpass')
  const [frequencyResponseCurve, setFrequencyResponseCurve] =
    useState<Float32Array | null>(null)
  const { modules, editModule, removeModule } = useWorkspace()
  const { node, getNode } = useAudioNode<'filter'>(moduleData)

  useEffect(() => {
    if (!node) {
      return
    }

    setFrequencyResponseCurve(node.getFrequencyResponse())
  }, [node])

  if (!node) {
    return null
  }

  const onFrequencyChange = (value: number) => {
    setFrequency(value)
    editModule<'filter'>(id, {
      settings: { ...moduleData.settings, frequency: value },
    })
    node.frequency.rampTo(value, 0)
  }

  const onTypeChange = (value: Tone.Filter['_type']) => {
    setFrequencyType(value)
    editModule<'filter'>(id, {
      settings: { ...moduleData.settings, type: value },
    })
    node.type = value
    // frequencyResponseCurve.current = node.getFrequencyResponse()
    setFrequencyResponseCurve(node.getFrequencyResponse())
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
    <div className="flex flex-col space-y-2 rounded p-2">
      <FrequencyDisplay value={frequency} />
      <FrequencyControl onChange={onFrequencyChange} />
      <div className="flex w-full items-baseline">
        {frequencyResponseCurve &&
          Array.from(frequencyResponseCurve).map((response) => (
            <div
              key={response}
              className="w-full bg-zinc-300"
              style={{ height: response * 25 }}
            />
          ))}
      </div>
      <FilterTypeSelect value={frequencyType} onChange={onTypeChange} />
      <div className="flex space-x-2 w-full">
        <button className="w-full" onClick={() => handleRemove(id)}>
          Remove
        </button>
      </div>
      <DestinationSelect
        destinations={modules.filter((module) => module.id !== id)}
        initialValue={'not_set'}
        onChange={onConnect}
      />
    </div>
  )
}

function FrequencyDisplay({ value }: { value: number }) {
  return <div>Frequency: {Math.round(value)} kHz</div>
}

function FrequencyControl({ onChange }: { onChange: (value: number) => void }) {
  return (
    <input
      aria-label="frequency"
      type="range"
      min={20}
      max={20000}
      onChange={(event) => {
        onChange(parseInt(event.target.value))
      }}
    />
  )
}

function FilterTypeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: Tone.ToneOscillatorType) => void
}) {
  const filterTypes = ['highpass', 'bandpass', 'lowpass'] as const

  return (
    <select
      aria-label="type"
      name="Filter type select"
      value={value}
      onChange={(event) =>
        onChange(event.target.value as Tone.ToneOscillatorType)
      }
    >
      {filterTypes.map((filterType) => (
        <option key={filterType} value={filterType}>
          {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
        </option>
      ))}
    </select>
  )
}
