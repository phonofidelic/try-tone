import { useState } from 'react'
import { DestinationSelect } from './DestinationSelect'
import { DeserializedModuleData, useWorkspace } from './Workspace'

export function Vca({
  moduleData,
  onRemove,
  onConnect,
}: {
  moduleData: DeserializedModuleData<'vca'>
  onRemove: (id: string) => void
  onConnect: (destinationId: string) => void
}) {
  const { modules } = useWorkspace()
  const { id, name, node } = moduleData
  const [volumeLevel, setVolumeLevel] = useState(node.volume.value)

  const onVolumeChange = (value: number) => {
    setVolumeLevel(value)
    node.volume.value = value
  }

  const handleRemove = () => {
    node.disconnect()
    node.dispose()
    onRemove(id)
  }

  return (
    <div className="flex flex-col space-y-2 border rounded p-2">
      <h2 className="text-2xl">{name}</h2>
      <div>Volume: {volumeLevel}</div>
      <input
        aria-label="volume"
        type="range"
        min={-20}
        max={20}
        defaultValue={0}
        onChange={(event) => {
          onVolumeChange(parseInt(event.target.value))
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
