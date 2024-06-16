import * as Tone from 'tone'
import { DestinationSelect } from './DestinationSelect'
import { useWorkspace } from './Workspace'

export function Envelope({
  id,
  name,
  node,
  onRemove,
  onConnect,
}: {
  id: string
  name: string
  node: Tone.Envelope
  onRemove: (id: string) => void
  onConnect: (destinationId: string) => void
}) {
  const { nodes } = useWorkspace()

  const onParameterChange = (
    parameter: 'attack' | 'decay' | 'sustain' | 'release',
    value: number,
  ) => {
    switch (parameter) {
      case 'attack':
        node.attack = value
        break
      case 'decay':
        node.decay = value
        break
      case 'sustain':
        node.sustain = value
        break
      case 'release':
        node.release = value
        break
      default:
        throw new Error(`Unhandled envelope parameter: ${parameter}`)
    }
  }

  const handleRemove = () => {
    node.disconnect()
    node.dispose()
    onRemove(id)
  }

  return (
    <div className="flex flex-col space-y-2 border rounded p-2 w-full">
      <h2 className="text-2xl">{name}</h2>
      <div className="flex flex-col w-fit mx-auto">
        <div className="flex w-full justify-between">
          A{' '}
          <RangeControl
            label="attack"
            initialValue={node.attack}
            range={[0, 2]}
            onChange={(value: number) => onParameterChange('attack', value)}
          />
        </div>
        <div className="flex w-full justify-between">
          D{' '}
          <RangeControl
            label="decay"
            initialValue={node.decay}
            range={[0, 2]}
            onChange={(value: number) => onParameterChange('decay', value)}
          />
        </div>
        <div className="flex w-full justify-between">
          S{' '}
          <RangeControl
            label="sustain"
            initialValue={node.sustain}
            range={[0, 1]}
            onChange={(value: number) => onParameterChange('sustain', value)}
          />
        </div>
        <div className="flex w-full justify-between">
          R{' '}
          <RangeControl
            label="release"
            initialValue={node.release}
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
        <button className="w-full" onClick={handleRemove}>
          Remove
        </button>
      </div>
      <DestinationSelect
        destinations={nodes.filter((node) => node.id !== id)}
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
  return (
    <input
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
