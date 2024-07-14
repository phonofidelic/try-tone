import { createContext, useContext, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import * as Tone from 'tone'
import { Dexie, type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { Toolbar } from './Toolbar'
import Tile from './Tile'
import { Oscillator } from './Oscillator'
import { Vca } from './Vca'
import { Envelope } from './Envelope'
import ContextMenu from './ContextMenu'
import Filter from './Filter'
import { Button } from './Button'
import { clamp, makeGrid, translateCoordinates } from '../utils'
import { SequencerPanel } from './Sequencer'

// eslint-disable-next-line react-refresh/only-export-components
export const db = new Dexie('ModuleDatabase') as Dexie & {
  modules: EntityTable<ModuleData<ModuleType>, 'id'>
  sequencers: EntityTable<SequencerData, 'id'>
}
db.version(1).stores({
  modules: '++id',
  sequencers: '++id, created',
})

export type SequencerData = {
  id: string
  name: string
  sequence: ReturnType<typeof makeGrid> | null
  pitchNodeId: string
  gateNodeId: string
  baseNote: string
  octave: string
  scale: number[] | null
  created: number
}
export type ModuleType = 'oscillator' | 'vca' | 'envelope' | 'filter'

export type ModuleData<T> = {
  id: string
  name: string
  sources: string[]
  destinations: string[]
  type: T
} & (
  | {
      type: 'oscillator'
      settings: {
        frequency: number
        type: Tone.ToneOscillatorType
      }
    }
  | {
      type: 'vca'
      settings: {
        volume: number
      }
    }
  | {
      type: 'envelope'
      settings: {
        attack: number
        decay: number
        sustain: number
        release: number
      }
    }
  | {
      type: 'filter'
      settings: {
        frequency: number
        type: 'highpass' | 'bandpass' | 'lowpass'
      }
    }
)

type WorkspaceContextValue = {
  modules: ModuleData<ModuleType>[]
  addModule: (newModule: ModuleData<ModuleType>) => void
  editModule<TModuleType>(
    moduleId: string,
    update: Partial<ModuleData<TModuleType>>,
  ): void
  removeModule: (moduleId: string) => void
  removeAllModules: () => void
  sequencers: SequencerData[]
  addSequencer: (newSequencer: SequencerData) => void
  editSequencer: (sequencerId: string, update: Partial<SequencerData>) => void
  removeSequencer: (sequencerId: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const modules = useLiveQuery<ModuleData<ModuleType>[], null>(
    () => db.modules.toArray(),
    [],
    null,
  )

  const addModule = async (newModule: ModuleData<ModuleType>) => {
    await db.modules.add(newModule)
  }

  async function editModule<TModuleType>(
    moduleId: string,
    update: Partial<ModuleData<TModuleType>>,
  ) {
    await db.modules.update(moduleId, { ...update })
  }

  const removeModule = async (moduleId: string) => {
    await db.modules.delete(moduleId)
  }

  const removeAllModules = async () => {
    await db.modules.clear()
  }

  const addSequencer = async (newSequencer: SequencerData) => {
    await db.sequencers.add(newSequencer)
  }

  const editSequencer = async (
    sequencerId: string,
    update: Partial<SequencerData>,
  ) => {
    await db.sequencers.update(sequencerId, { ...update })
  }

  const removeSequencer = async (sequencerId: string) => {
    await db.sequencers.delete(sequencerId)
  }

  const sequencers = useLiveQuery<SequencerData[], []>(
    () => db.sequencers.orderBy('created').toArray(),
    [],
    [],
  )

  if (!modules) {
    return null
  }

  return (
    <WorkspaceContext.Provider
      value={{
        modules,
        addModule,
        editModule,
        removeModule,
        removeAllModules,
        sequencers,
        addSequencer,
        editSequencer,
        removeSequencer,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const workspaceContext = useContext(WorkspaceContext)

  if (!workspaceContext) {
    throw new Error(
      'useWorkspace must be used within a WorkspaceContextProvider',
    )
  }

  return workspaceContext
}

export function Workspace() {
  const { modules, removeAllModules } = useWorkspace()

  const defaultOriginCoordinates = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextMenuClickOrigin, setContextMenuClickOrigin] = useState(
    defaultOriginCoordinates,
  )
  const [scale, setScale] = useState(1)
  const workspaceDivRef = useRef<HTMLDivElement | null>(null)
  const [spaceIsPressed, setSpaceIsPressed] = useState(false)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [screenOffset, setScreenOffset] = useState({ x: 0, y: 0 })
  const [panOrigin, setPanOrigin] = useState<{ x: number; y: number } | null>(
    null,
  )

  useEffect(() => {
    if (!workspaceDivRef.current) {
      return
    }
    const workspaceDiv = workspaceDivRef.current

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (event.ctrlKey) {
        setScale((prev) => clamp(prev + event.deltaY / 100, 1, 4))
        return
      }

      setScreenOffset((prev) => ({
        x: prev.x - event.deltaX * scale,
        y: prev.y - event.deltaY * scale,
      }))
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceIsPressed(true)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceIsPressed(false)
      }
    }

    workspaceDiv.addEventListener('wheel', onWheel, { passive: false })
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      workspaceDiv.removeEventListener('wheel', onWheel)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [scale])

  return (
    <>
      <ContextMenu
        open={contextMenuOpen}
        clickOrigin={contextMenuClickOrigin}
        onDismiss={() => setContextMenuOpen(false)}
      >
        <div className="flex flex-col space-y-2 *:shadow">
          <Toolbar
            modules={modules}
            onSelect={() => {
              setContextMenuOpen(false)
            }}
          />
        </div>
      </ContextMenu>
      <div className="fixed top-0 flex w-screen p-2 z-10">
        <div className="flex space-x-2">
          <Toolbar modules={modules} />
        </div>
        <div className="flex w-full space-x-2 justify-end">
          <Button
            onClick={() => {
              removeAllModules()
            }}
          >
            Clear Workspace
          </Button>
          <Button
            onClick={() => {
              setScale(1)
              setScreenOffset({ x: 0, y: 0 })
            }}
          >
            Reset view
          </Button>
        </div>
      </div>
      <div
        ref={workspaceDivRef}
        className={clsx(
          'fixed flex flex-col w-screen h-screen top-0 left-0 select-none bg-zinc-100 dark:bg-zinc-900',
          {
            'cursor-grab': spaceIsPressed,
            'cursor-grabbing': isGrabbing,
          },
        )}
        onMouseDown={(event) => {
          if (spaceIsPressed && event.buttons > 0) {
            setIsGrabbing(true)
            setPanOrigin({
              x: event.screenX * scale - screenOffset.x,
              y: event.screenY * scale - screenOffset.y,
            })
          }
        }}
        onMouseMove={(event) => {
          if (spaceIsPressed && event.buttons > 0 && panOrigin) {
            setScreenOffset({
              x: event.screenX * scale - panOrigin.x,
              y: event.screenY * scale - panOrigin.y,
            })
          }
        }}
        onMouseUp={() => {
          setIsGrabbing(false)
        }}
        onContextMenu={(event) => {
          event.preventDefault()
          setContextMenuClickOrigin({ x: event.clientX, y: event.clientY })
          setContextMenuOpen(true)
        }}
      >
        <div
          className="relative size-full"
          style={{
            transform: `scale(${1 / scale}) translate(${screenOffset.x}px, ${screenOffset.y}px)`,
          }}
        >
          {modules.map((module) => {
            switch (module.type) {
              case 'oscillator':
                return (
                  <Tile
                    key={`tile_${module.id}`}
                    id={`tile_${module.id}`}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                    header={module.name}
                  >
                    <Oscillator key={module.id} moduleData={module} />
                  </Tile>
                )
              case 'vca':
                return (
                  <Tile
                    key={`tile_${module.id}`}
                    id={`tile_${module.id}`}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                    header={module.name}
                  >
                    <Vca key={module.id} moduleData={module} />
                  </Tile>
                )
              case 'envelope':
                return (
                  <Tile
                    key={`tile_${module.id}`}
                    id={`tile_${module.id}`}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                    header={module.name}
                  >
                    <Envelope key={module.id} moduleData={module} />
                  </Tile>
                )
              case 'filter':
                return (
                  <Tile
                    key={`tile_${module.id}`}
                    id={`tile_${module.id}`}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                    header={module.name}
                  >
                    <Filter key={module.id} moduleData={module} />
                  </Tile>
                )
            }
          })}
        </div>
      </div>
      <div className="fixed left-0 bottom-0 z-10 w-full p-2">
        <SequencerPanel />
      </div>
      {/* <CursorDebug scale={scale} offset={screenOffset} /> */}
    </>
  )
}
