import { useState } from 'react'
import * as Tone from 'tone'
import { frequencyRange } from '@/constants'
import { ModuleData, useModules } from '@/ModulesContext'
import { useAudioNode } from '@/AudioNodeContext'
import { DestinationSelect } from './DestinationSelect'
import { KnobInput } from './KnobInput'
import { LedIndicator } from './LedIndicator'

export function Oscillator({
  moduleData,
}: {
  moduleData: ModuleData<'oscillator' | 'lfo'>
}) {
  const { id } = moduleData
  const [displayState, setDisplayState] = useState<'started' | 'stopped'>(
    'stopped',
  )
  const { modules, editModule, removeModule } = useModules()
  const { node, getNode } = useAudioNode<'oscillator' | 'lfo'>(moduleData)

  if (!node) {
    return null
  }

  const onFrequencyChange = async (value: number) => {
    editModule<'oscillator' | 'lfo'>(id, {
      settings: {
        ...moduleData.settings,
        frequency: Tone.Frequency(value).toFrequency(),
      },
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
          id={moduleData.id}
          initialValue={moduleData.settings.frequency}
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
