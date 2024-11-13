import { useEffect, useState } from 'react'
import { DestinationSelect } from './DestinationSelect'
import { ModuleData, useWorkspace } from './Workspace'
import { useAudioNode } from '../AudioNodeContext'
import { useStopTouchmovePropagation } from '@/hooks'

export function Vca({ moduleData }: { moduleData: ModuleData<'vca'> }) {
  const { id } = moduleData
  const { modules, editModule, removeModule } = useWorkspace()
  const { node, getNode } = useAudioNode<'vca'>(moduleData)
  const [volumeLevel, setVolumeLevel] = useState(0)

  useEffect(() => {
    if (!node) {
      return
    }
    setVolumeLevel(Math.round(node.volume.value))
  }, [node])

  if (!node) {
    return null
  }

  const onVolumeChange = (value: number) => {
    setVolumeLevel(value)
    editModule<'vca'>(id, {
      settings: { ...moduleData.settings, volume: value },
    })
    node.volume.value = value
  }

  const handleRemove = () => {
    node.disconnect()
    node.dispose()
    removeModule(id)
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

  return (
    <div className="flex flex-col space-y-2 rounded p-2">
      <div>Volume: {volumeLevel}</div>
      <VolumeControl value={volumeLevel} onChange={onVolumeChange} />
      <button onClick={handleRemove}>Remove</button>
      <DestinationSelect
        destinations={modules.filter((module) => module.id !== id)}
        initialValue={moduleData.destinations[0] ?? 'not_set'}
        onChange={onConnect}
      />
    </div>
  )
}

function VolumeControl({
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
      aria-label="volume"
      type="range"
      min={-20}
      max={20}
      value={value}
      onChange={(event) => {
        onChange(Math.round(parseInt(event.target.value)))
      }}
    />
  )
}
