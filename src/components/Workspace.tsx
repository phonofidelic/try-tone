import { createContext, useContext, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import * as Tone from 'tone'
import { Toolbar } from './Toolbar'
import Tile from './Tile'
import { Oscillator } from './Oscillator'
import { Vca } from './Vca'
import { Envelope } from './Envelope'
import ContextMenu from './ContextMenu'
import Filter from './Filter'
import { Button } from './Button'
import { clamp, deserializeModuleState, translateCoordinates } from '../utils'
import { Sequencer } from './Sequencer'

export type ModuleData = {
  id: string
  name: string
  sources: string[]
  destinations: string[]
  position: { x: number; y: number } | null
  type: ModuleType
}

export type ModuleType = 'oscillator' | 'vca' | 'envelope' | 'mixer' | 'filter'

export type DeserializedModuleData<T> = ModuleData & {
  type: T
} & (
    | {
        type: 'oscillator'
        node: Tone.Oscillator
      }
    | {
        type: 'vca'
        node: Tone.Volume
      }
    | {
        type: 'envelope'
        node: Tone.AmplitudeEnvelope
      }
    | {
        type: 'mixer'
        node: Tone.Merge
      }
    | {
        type: 'filter'
        node: Tone.Filter
      }
  )

type WorkspaceContextValue = {
  modules: DeserializedModuleData<ModuleType>[]
  addModule: (newModule: DeserializedModuleData<ModuleType>) => void
  removeModule: (moduleId: string) => void
  connectModules: (source: string, destination: string) => void
  removeAllModules: () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [modules, setModules] = useState<DeserializedModuleData<ModuleType>[]>(
    () => {
      const serializedModuleState = localStorage.getItem('moduleState')
      if (serializedModuleState) {
        return deserializeModuleState(serializedModuleState)
      }
      return []
    },
  )

  const addModule = (newModule: DeserializedModuleData<ModuleType>) => {
    setModules([...modules, newModule])
  }

  const removeModule = (moduleId: string) => {
    const moduleToRemove = modules.find((module) => module.id === moduleId)

    if (!moduleToRemove) {
      return
    }

    const mutatedNodeList = modules
      .map((module) => ({
        ...module,
        sources: module.sources.filter(
          (sourceId) => sourceId !== moduleToRemove.id,
        ),
        destinations: modules
          .filter((module) => module.id !== moduleToRemove.id)
          .map((module) => module.id),
      }))
      .filter((module) => module.id !== moduleToRemove.id)

    setModules(mutatedNodeList)
    moduleToRemove.node.disconnect().dispose()
  }

  const connectModules = (sourceId: string, destinationId: string) => {
    const sourceModule = modules.find((module) => module.id === sourceId)
    if (!sourceModule) {
      return
    }

    if (destinationId === 'not_set') {
      setModules(
        modules.map((module) =>
          module.id === sourceModule.id
            ? {
                ...sourceModule,
                destinations: ['not_set'],
              }
            : module,
        ),
      )

      sourceModule.node.disconnect()
      return
    }

    if (destinationId === 'out') {
      setModules(
        modules.map((module) =>
          module.id === sourceModule.id
            ? {
                ...sourceModule,
                destinations: ['out'],
              }
            : module,
        ),
      )

      sourceModule.node.disconnect()
      sourceModule.node.toDestination()
      return
    }

    const destinationModule = modules.find(
      (module) => module.id === destinationId,
    )
    if (!destinationModule) {
      return
    }

    setModules(
      modules.map((module) => {
        if (module.id === sourceModule.id) {
          return {
            ...sourceModule,
            destinations: [destinationModule.id],
          }
        }

        if (module.id === destinationModule.id) {
          return {
            ...destinationModule,
            sources: [sourceModule.id],
          }
        }

        return module
      }),
    )

    sourceModule.node.disconnect()
    sourceModule.node.connect(destinationModule.node)
  }

  const removeAllModules = () => {
    modules.forEach((module) => {
      module.node.disconnect().dispose()
    })
    setModules([])
  }

  useEffect(() => {
    const serializedModuleState = localStorage.getItem('moduleState')
    if (serializedModuleState) {
      const deserializedModuleState = deserializeModuleState(
        serializedModuleState,
      )

      deserializedModuleState.forEach((module) => {
        for (const connectionId of module.destinations) {
          if (connectionId === 'out') {
            module.node.toDestination()
          } else {
            const destinationModule = deserializedModuleState.find(
              (moduleData) => moduleData.id === connectionId,
            )
            if (destinationModule) {
              module.node.connect(destinationModule.node)
            }
          }
        }
      })

      setModules(deserializedModuleState)
    } else {
      setModules([
        {
          id: crypto.randomUUID(),
          type: 'oscillator',
          name: 'Oscillator 1',
          node: new Tone.Oscillator(440, 'sine'),
          sources: [],
          destinations: [],
          position: null,
        },
      ])
    }
  }, [])

  useEffect(() => {
    const moduleState = modules.map((moduleData) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { node, ...rest } = moduleData
      return rest
    })
    const stringifiedState = JSON.stringify(moduleState)
    localStorage.setItem('moduleState', stringifiedState)
  }, [modules])

  return (
    <WorkspaceContext.Provider
      value={{
        modules: modules,
        addModule: addModule,
        removeModule: removeModule,
        connectModules: connectModules,
        removeAllModules: removeAllModules,
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
  const { modules, addModule, removeModule, connectModules, removeAllModules } =
    useWorkspace()
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
            clickOrigin={contextMenuClickOrigin}
            addModule={addModule}
            onSelect={() => {
              setContextMenuOpen(false)
            }}
          />
        </div>
      </ContextMenu>
      <div className="fixed top-0 flex w-screen p-2 z-10">
        <div className="flex space-x-2">
          <Toolbar modules={modules} addModule={addModule} />
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
                    key={module.id}
                    initialPos={translateCoordinates(
                      module.position ?? defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Oscillator
                      key={module.id}
                      moduleData={module}
                      onRemove={removeModule}
                      onConnect={(destinationId) =>
                        connectModules(module.id, destinationId)
                      }
                    />
                  </Tile>
                )
              case 'vca':
                return (
                  <Tile
                    key={module.id}
                    initialPos={translateCoordinates(
                      module.position ?? defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Vca
                      key={module.id}
                      moduleData={module}
                      onRemove={removeModule}
                      onConnect={(destinationId) =>
                        connectModules(module.id, destinationId)
                      }
                    />
                  </Tile>
                )
              case 'envelope':
                return (
                  <Tile
                    key={module.id}
                    initialPos={translateCoordinates(
                      module.position ?? defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Envelope
                      key={module.id}
                      moduleData={module}
                      onRemove={removeModule}
                      onConnect={(destinationId) =>
                        connectModules(module.id, destinationId)
                      }
                    />
                  </Tile>
                )
              case 'filter':
                return (
                  <Tile
                    key={module.id}
                    initialPos={translateCoordinates(
                      module.position ?? defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Filter
                      key={module.id}
                      moduleData={module}
                      onRemove={removeModule}
                      onConnect={(destinationId) =>
                        connectModules(module.id, destinationId)
                      }
                    />
                  </Tile>
                )
              case 'mixer':
                return null
            }
          })}
        </div>
      </div>
      <div className="fixed left-0 bottom-0 z-10 w-full p-2">
        <Sequencer />
      </div>
      {/* <CursorDebug scale={scale} offset={screenOffset} /> */}
    </>
  )
}
