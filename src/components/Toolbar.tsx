import * as Tone from 'tone'
import { ModuleData } from './Workspace'

export function Toolbar({
  nodes,
  addNode,
}: {
  nodes: ModuleData[]
  addNode: (data: ModuleData) => void
}) {
  return (
    <div className="flex w-screen space-x-2 p-2">
      <button
        onClick={() =>
          addNode({
            id: crypto.randomUUID(),
            type: 'oscillator',
            name: `Oscillator ${nodes.filter((node) => node.type === 'oscillator').length + 1}`,
            node: new Tone.Oscillator(440, 'sine'),
            sources: [],
            destinations: [],
          })
        }
      >
        Add Oscillator
      </button>
      <button
        onClick={() =>
          addNode({
            id: crypto.randomUUID(),
            type: 'vca',
            name: `VCA ${nodes.filter((node) => node.type === 'vca').length + 1}`,
            node: new Tone.Volume(),
            sources: [],
            destinations: [],
          })
        }
      >
        Add VCA
      </button>
      <button
        onClick={() =>
          addNode({
            id: crypto.randomUUID(),
            type: 'envelope',
            name: `Envelope ${nodes.filter((node) => node.type === 'envelope').length + 1}`,
            node: new Tone.AmplitudeEnvelope(),
            sources: [],
            destinations: [],
          })
        }
      >
        Add Envelope
      </button>
    </div>
  )
}
