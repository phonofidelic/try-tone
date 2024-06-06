import { useState } from 'react'
import * as Tone from 'tone'

export function Vca({
  id,
  name,
  node,
  onRemove,
}: {
  id: string
  name: string
  node: Tone.Volume
  onRemove: (id: string) => void
}) {
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
      <div>
        <h2 className="text-2xl">{name}</h2>
      </div>
      <div>Volume: {volumeLevel}</div>
      <div>
        <input
          type="range"
          min={-20}
          max={20}
          defaultValue={0}
          onChange={(event) => {
            onVolumeChange(parseInt(event.target.value))
          }}
        />
      </div>
      <button onClick={handleRemove}>Remove</button>
    </div>
  )
}
