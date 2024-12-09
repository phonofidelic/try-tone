import { useState } from 'react'
import * as Tone from 'tone'
import { ModuleData, useModules } from '@/ModulesContext'
import { useAudioNode } from '@/AudioNodeContext'
import { clamp } from '@/utils'
import { frequencyRange } from '@/constants'
import { DestinationSelect } from './DestinationSelect'
import { KnobInput } from './KnobInput'

export default function Filter({
  moduleData,
}: {
  moduleData: ModuleData<'filter'>
}) {
  const { id } = moduleData
  const [frequencyType, setFrequencyType] = useState(moduleData.settings.type)
  const { modules, editModule, removeModule } = useModules()
  const { node, getNode } = useAudioNode<'filter'>(moduleData)
  const [filterRollOff, setFilterRollOff] = useState<Tone.FilterRollOff>(
    moduleData.settings.rolloff ?? -12,
  )

  if (!node) {
    return null
  }

  const onFrequencyChange = (value: number) => {
    const clampedValue = clamp(
      value,
      frequencyRange[moduleData.type].min,
      frequencyRange[moduleData.type].max,
    )
    editModule<'filter'>(id, {
      settings: { ...moduleData.settings, frequency: clampedValue },
    })
    node.frequency.rampTo(Tone.Frequency(value).toFrequency(), 0)
  }

  const onTypeChange = (value: Tone.Filter['_type']) => {
    setFrequencyType(value)
    editModule<'filter'>(id, {
      settings: { ...moduleData.settings, type: value },
    })
    node.type = value
  }

  const onFilterRollOffChange = (value: Tone.FilterRollOff) => {
    editModule<'filter'>(id, {
      settings: { ...moduleData.settings, rolloff: value },
    })
    node.rolloff = value
    setFilterRollOff(value)
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
    <div className="flex gap-y-2 flex-col justify-between h-[calc(100%-52px)] p-2">
      <div className="flex w-full justify-center">
        <KnobInput
          id={moduleData.id}
          initialValue={moduleData.settings.frequency}
          label="Cutoff"
          min={frequencyRange[moduleData.type].min}
          max={frequencyRange[moduleData.type].max}
          step={frequencyRange[moduleData.type].step}
          units={['Hz', 'kHz']}
          onChange={onFrequencyChange}
        />
      </div>
      <FilterRolloffSelect
        value={filterRollOff}
        onChange={onFilterRollOffChange}
      />
      <FilterTypeSelect value={frequencyType} onChange={onTypeChange} />
      <div className="flex space-x-2 w-full">
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

function FilterRolloffSelect({
  value,
  onChange,
}: {
  value: Tone.FilterRollOff
  onChange: (value: Tone.FilterRollOff) => void
}) {
  const filterRolloffs = ['-12', '-24', '-48', '-96'] as const

  return (
    <select
      aria-label="rolloff"
      name="Filter rolloff select"
      value={value}
      onChange={(event) =>
        onChange(Number(event.target.value) as Tone.FilterRollOff)
      }
    >
      {filterRolloffs.map((filterRolloff) => (
        <option key={filterRolloff} value={filterRolloff}>
          {filterRolloff}
        </option>
      ))}
    </select>
  )
}
