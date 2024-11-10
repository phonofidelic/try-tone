import { ModuleData, ModuleType, useWorkspace } from './Workspace'
import { Button } from './Button'

export function Toolbar({
  modules,
  // addModule,
  onSelect,
}: {
  modules: ModuleData<ModuleType>[]
  // addModule: (data: ModuleData<ModuleType>) => void
  onSelect?: (event: React.MouseEvent) => void
}) {
  const { addModule } = useWorkspace()

  return (
    <>
      <Button
        onClick={(event) => {
          addModule({
            id: crypto.randomUUID(),
            type: 'oscillator',
            name: `Oscillator ${modules.filter((module) => module.type === 'oscillator').length + 1}`,
            sources: [],
            destinations: [],
            settings: {
              frequency: 440,
              type: 'sine',
            },
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
            sources: [],
            destinations: [],
            settings: {
              volume: 0,
            },
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
            sources: [],
            destinations: [],
            settings: {
              attack: 0.1,
              decay: 0.2,
              sustain: 1.0,
              release: 0.8,
            },
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
            sources: [],
            destinations: [],
            settings: {
              type: 'lowpass',
              frequency: 350,
            },
          })
          typeof onSelect === 'function' && onSelect(event)
        }}
      >
        Add Filter
      </Button>
    </>
  )
}
