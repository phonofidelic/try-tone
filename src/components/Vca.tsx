import { useEffect, useState } from 'react'
import { DestinationSelect } from './DestinationSelect'
import { ModuleData, useWorkspace } from './Workspace'
import { useAudioNode } from '../AudioNodeContext'

export function Vca({ moduleData }: { moduleData: ModuleData<'vca'> }) {
  const { id } = moduleData
  const { modules, editModule, removeModule } = useWorkspace()
  const { node, getNode } = useAudioNode<'vca'>(moduleData)
  const [volumeLevel, setVolumeLevel] = useState(0)

  useEffect(() => {
    if (!node) {
      return
    }
    setVolumeLevel(node.volume.value)
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
      <input
        aria-label="volume"
        type="range"
        min={-20}
        max={20}
        defaultValue={0}
        onChange={(event) => {
          onVolumeChange(Math.round(parseInt(event.target.value)))
        }}
      />
      <button onClick={handleRemove}>Remove</button>
      <DestinationSelect
        destinations={modules.filter((module) => module.id !== id)}
        initialValue={moduleData.destinations[0] ?? 'not_set'}
        onChange={onConnect}
      />
    </div>
  )
}
