import * as Tone from 'tone'
import { ModuleData } from './Workspace'
import { Button } from './Button'

export function Toolbar({
  nodes,
  addNode,
  onSelect,
}: {
  nodes: ModuleData[]
  addNode: (data: ModuleData) => void
  onSelect?: (event: React.MouseEvent) => void
}) {
  return (
    <>
      <Button
        onClick={(event) => {
          addNode({
            id: crypto.randomUUID(),
            type: 'oscillator',
            name: `Oscillator ${nodes.filter((node) => node.type === 'oscillator').length + 1}`,
            node: new Tone.Oscillator(440, 'sine'),
            sources: [],
            destinations: [],
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add Oscillator
      </Button>
      <Button
        onClick={(event) => {
          addNode({
            id: crypto.randomUUID(),
            type: 'vca',
            name: `VCA ${nodes.filter((node) => node.type === 'vca').length + 1}`,
            node: new Tone.Volume(),
            sources: [],
            destinations: [],
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add VCA
      </Button>
      <Button
        onClick={(event) => {
          addNode({
            id: crypto.randomUUID(),
            type: 'envelope',
            name: `Envelope ${nodes.filter((node) => node.type === 'envelope').length + 1}`,
            node: new Tone.AmplitudeEnvelope(),
            sources: [],
            destinations: [],
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add Envelope
      </Button>
      <Button
        onClick={(event) => {
          addNode({
            id: crypto.randomUUID(),
            type: 'filter',
            name: `Filter ${nodes.filter((node) => node.type === 'filter').length + 1}`,
            node: new Tone.Filter(440, 'bandpass'),
            sources: [],
            destinations: [],
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add Filter
      </Button>
    </>
  )
}
