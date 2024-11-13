import * as Tone from 'tone'
import { DestinationSelect } from './DestinationSelect'
import { ModuleData, useWorkspace } from './Workspace'
import { useAudioNode } from '../AudioNodeContext'
import { useStopTouchmovePropagation } from '@/hooks'

export function Envelope({
  moduleData,
}: {
  moduleData: ModuleData<'envelope'>
}) {
  const { id } = moduleData
  const { modules, editModule, removeModule } = useWorkspace()
  const { node, getNode } = useAudioNode<'envelope'>(moduleData)

  if (!node) {
    return null
  }

  const onParameterChange = (
    parameter: 'attack' | 'decay' | 'sustain' | 'release',
    value: number,
  ) => {
    switch (parameter) {
      case 'attack':
        editModule<'envelope'>(id, {
          settings: { ...moduleData.settings, attack: value },
        })
        node.attack = value
        break
      case 'decay':
        editModule<'envelope'>(id, {
          settings: { ...moduleData.settings, decay: value },
        })
        node.decay = value
        break
      case 'sustain':
        editModule<'envelope'>(id, {
          settings: { ...moduleData.settings, sustain: value },
        })
        node.sustain = value
        break
      case 'release':
        editModule<'envelope'>(id, {
          settings: { ...moduleData.settings, release: value },
        })
        node.release = value
        break
      default:
        throw new Error(`Unhandled envelope parameter: ${parameter}`)
    }
  }

  const onConnect = (destinationId: string) => {
    node.disconnect()
    if (destinationId === 'out') {
      node.toDestination()
    } else {
      const destinationNode = getNode(destinationId)
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
    <div className="flex flex-col space-y-2 rounded p-2 w-full">
      <div className="flex flex-col w-fit mx-auto">
        <div className="flex w-full justify-between">
          A{' '}
          <RangeControl
            label="attack"
            initialValue={moduleData.settings.attack}
            range={[0, 2]}
            onChange={(value: number) => onParameterChange('attack', value)}
          />
        </div>
        <div className="flex w-full justify-between">
          D{' '}
          <RangeControl
            label="decay"
            initialValue={moduleData.settings.decay}
            range={[0, 2]}
            onChange={(value: number) => onParameterChange('decay', value)}
          />
        </div>
        <div className="flex w-full justify-between">
          S{' '}
          <RangeControl
            label="sustain"
            initialValue={moduleData.settings.sustain}
            range={[0, 1]}
            onChange={(value: number) => onParameterChange('sustain', value)}
          />
        </div>
        <div className="flex w-full justify-between">
          R{' '}
          <RangeControl
            label="release"
            initialValue={moduleData.settings.release}
            range={[0, 2]}
            onChange={(value: number) => onParameterChange('release', value)}
          />
        </div>
      </div>
      <div className="flex space-x-2 w-full">
        <button
          className="w-full"
          onClick={() => {
            node.triggerAttackRelease(0.5)
          }}
        >
          Trig
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

function RangeControl({
  initialValue,
  range,
  label,
  onChange,
}: {
  initialValue: Tone.Unit.Time
  range: [number, number]
  label: string
  onChange: (value: number) => void
}) {
  const inputRef = useStopTouchmovePropagation()

  return (
    <input
      ref={inputRef}
      className="w-full"
      aria-label={label}
      type="range"
      step={0.1}
      defaultValue={initialValue as number}
      min={range[0]}
      max={range[1]}
      onChange={(event) => {
        onChange(parseFloat(event.target.value))
      }}
    />
  )
}
