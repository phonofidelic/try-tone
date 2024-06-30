import * as Tone from 'tone'
import { DeserializedModuleData, ModuleData, ModuleType } from './Workspace'
import { Button } from './Button'

export function Toolbar({
  modules,
  clickOrigin,
  addModule,
  onSelect,
}: {
  modules: ModuleData[]
  clickOrigin?: { x: number; y: number } | undefined
  addModule: (data: DeserializedModuleData<ModuleType>) => void
  onSelect?: (event: React.MouseEvent) => void
}) {
  return (
    <>
      <Button
        onClick={(event) => {
          addModule({
            id: crypto.randomUUID(),
            type: 'oscillator',
            name: `Oscillator ${modules.filter((module) => module.type === 'oscillator').length + 1}`,
            node: new Tone.Oscillator(440, 'sine'),
            sources: [],
            destinations: [],
            position: clickOrigin ?? null,
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add Oscillator
      </Button>
      <Button
        onClick={(event) => {
          addModule({
            id: crypto.randomUUID(),
            type: 'vca',
            name: `VCA ${modules.filter((module) => module.type === 'vca').length + 1}`,
            node: new Tone.Volume(),
            sources: [],
            destinations: [],
            position: clickOrigin ?? null,
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add VCA
      </Button>
      <Button
        onClick={(event) => {
          addModule({
            id: crypto.randomUUID(),
            type: 'envelope',
            name: `Envelope ${modules.filter((module) => module.type === 'envelope').length + 1}`,
            node: new Tone.AmplitudeEnvelope(),
            sources: [],
            destinations: [],
            position: clickOrigin ?? null,
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add Envelope
      </Button>
      <Button
        onClick={(event) => {
          addModule({
            id: crypto.randomUUID(),
            type: 'filter',
            name: `Filter ${modules.filter((module) => module.type === 'filter').length + 1}`,
            node: new Tone.Filter(440, 'bandpass'),
            sources: [],
            destinations: [],
            position: clickOrigin ?? null,
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add Filter
      </Button>
    </>
  )
}
