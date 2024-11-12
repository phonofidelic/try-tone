import { ModuleData, ModuleType, useWorkspace } from './Workspace'
import { Button } from './Button'
import { Backdrop } from './ContextMenu'

export function Toolbar({
  isToolbarMenuOpen,
  menuContent,
  toolbarContent,
  onOpenToolbarMenu,
  onCloseToolbarMenu,
}: {
  isToolbarMenuOpen: boolean
  menuContent: React.ReactNode
  toolbarContent: React.ReactNode
  onOpenToolbarMenu: () => void
  onCloseToolbarMenu: () => void
}) {
  return (
    <div className="fixed top-0 flex w-screen p-2 z-20">
      <div className="flex relative flex-col gap-2">
        <Button
          onClick={() => {
            onOpenToolbarMenu()
          }}
        >
          Menu
        </Button>
        <div>
          <Backdrop open={isToolbarMenuOpen} onDismiss={onCloseToolbarMenu}>
            <div className="flex flex-col gap-2">
              {menuContent}
              <div
                className="flex flex-col gap-2 md:hidden"
                onClick={onCloseToolbarMenu}
              >
                {toolbarContent}
              </div>
            </div>
          </Backdrop>
        </div>
      </div>
      <div className="hidden md:flex w-full space-x-2 justify-end">
        {toolbarContent}
      </div>
    </div>
  )
}

export function ModuleListAdd({
  modules,
  onSelect,
}: {
  modules: ModuleData<ModuleType>[]
  onSelect?: (event: React.MouseEvent) => void
}) {
  const { addModule } = useWorkspace()

  return (
    <div className="flex flex-col gap-2">
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
    </div>
  )
}
