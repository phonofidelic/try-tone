import * as Tone from 'tone'
import { DestinationSelect } from './DestinationSelect'
import { DeserializedModuleData, useWorkspace } from './Workspace'
import { useRef, useState } from 'react'

export default function Filter({
  moduleData,
  onRemove,
  onConnect,
}: {
  moduleData: DeserializedModuleData<'filter'>
  onRemove: (id: string) => void
  onConnect: (destinationId: string) => void
}) {
  const { id, name, node } = moduleData
  const { modules } = useWorkspace()
  const [frequency, setFrequency] = useState(20)
  const [frequencyType, setFrequencyType] = useState('bandpass')

  const frequencyResponseCurve = useRef(node.getFrequencyResponse())

  const onFrequencyChange = (value: number) => {
    setFrequency(value)
    node.frequency.rampTo(value, 0)
  }

  const onTypeChange = (value: Tone.Filter['_type']) => {
    setFrequencyType(value)
    node.type = value
    frequencyResponseCurve.current = node.getFrequencyResponse()
  }

  const handleRemove = (id: string) => {
    node.disconnect()
    node.dispose()
    onRemove(id)
  }

  return (
    <div className="flex flex-col space-y-2 border rounded p-2">
      <h2 className="text-2xl">{name}</h2>
      <FrequencyDisplay value={frequency} />
      <FrequencyControl onChange={onFrequencyChange} />
      <div className="flex w-full items-baseline">
        {frequencyResponseCurve.current &&
          Array.from(frequencyResponseCurve.current).map((response) => (
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
