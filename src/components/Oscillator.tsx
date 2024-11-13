import { useEffect, useState } from 'react'
import * as Tone from 'tone'
import { DestinationSelect } from './DestinationSelect'
import { ModuleData, useWorkspace } from './Workspace'
import { useAudioNode, type ModuleNode } from '../AudioNodeContext'
import { useStopTouchmovePropagation } from '@/hooks'

const frequencyRange = {
  oscillator: {
    min: 10.1,
    max: 20000,
  },
  lfo: {
    min: 0.1,
    max: 10,
  },
}

export function Oscillator({
  moduleData,
}: {
  moduleData: ModuleData<'oscillator' | 'lfo'>
}) {
  const { id } = moduleData
  const [frequency, setFrequency] = useState(moduleData.settings.frequency)
  const [displayState, setDisplayState] = useState<'started' | 'stopped'>(
    'stopped',
  )
  const { modules, editModule, removeModule } = useWorkspace()
  const { node, getNode } = useAudioNode<'oscillator' | 'lfo'>(moduleData)

  if (!node) {
    return null
  }

  const onFrequencyChange = async (value: number) => {
    const roundedValue = Math.round((value + Number.EPSILON) * 100) / 100
    setFrequency(roundedValue)
    editModule<'oscillator' | 'lfo'>(id, {
      settings: { ...moduleData.settings, frequency: roundedValue },
    })
    node.frequency.rampTo(Tone.Frequency(roundedValue).toFrequency(), 0)
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
      {moduleData.type === 'lfo' && <LedIndicator node={node} />}
      <FrequencyDisplay value={frequency} />
      <FrequencyControl
        type={moduleData.type}
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
  return <div>Frequency: {value} Hz</div>
}

function FrequencyControl({
  type,
  value,
  onChange,
}: {
  type: 'oscillator' | 'lfo'
  value: number
  onChange: (value: number) => void
}) {
  const inputRef = useStopTouchmovePropagation()

  return (
    <input
      ref={inputRef}
      aria-label="frequency"
      type="range"
      min={frequencyRange[type].min}
      max={frequencyRange[type].max}
      value={value}
      step="0.1"
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

function LedIndicator({
  node,
}: {
  node: ModuleNode<'oscillator' | 'lfo'>['data']
}) {
  const [indicatorValue, setOutputValue] = useState<number>(0)
  useEffect(() => {
    if (!node) {
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

    const intervalId = setInterval(updateOutputValue, 100)

    return () => {
      clearInterval(intervalId)
      analyser.disconnect()
    }
  }, [node])
  return (
    <div className="flex relative w-full justify-center p-4 h-[16px]">
      <div
        className="size-4 m-auto rounded-full absolute border-2 z-10"
        style={{
          backgroundColor: `rgb(${Math.max(indicatorValue * 100, 50)}, 0, 0)`,
          borderColor: `rgb(${Math.max(indicatorValue * 100, 50)}, 50, 50)`,
        }}
      />
      <div
        className="size-4 m-auto rounded-full bg-red-500 blur-md absolute z-20"
        style={{ opacity: indicatorValue }}
      />
    </div>
  )
}
