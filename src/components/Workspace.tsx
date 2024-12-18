import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'
import { HP_1, U_1 } from '@/constants'
import { clamp, translateCoordinates } from '@/utils'
import { useModules } from '@/ModulesContext'
import { ModuleListAdd, Toolbar } from './Toolbar'
import Tile from './Tile'
import { Oscillator } from './Oscillator'
import { Vca } from './Vca'
import { Envelope } from './Envelope'
import { ContextMenu } from './ContextMenu'
import Filter from './Filter'
import { Button } from './Button'
import { SequencerPanel } from './Sequencer'

const RACK_U = 6
const RACK_HP = 104

type WorkspaceContextValue = {
  scale: number
  screenOffset: { x: number; y: number }
  setScale: Dispatch<SetStateAction<number>>
  setScreenOffset: Dispatch<SetStateAction<{ x: number; y: number }>>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [scale, setScale] = useState(1)
  const [screenOffset, setScreenOffset] = useState({ x: 0, y: 0 })
  return (
    <WorkspaceContext.Provider
      value={{ scale, screenOffset, setScale, setScreenOffset }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === null) {
    throw new Error(
      'useWorkspaceContext must be used within a WorkspaceContextProvider',
    )
  }
  return context
}

export function Workspace() {
  const { modules, removeAllModules } = useModules()
  const { scale, screenOffset, setScale, setScreenOffset } = useWorkspace()

  const defaultOriginCoordinates = {
    x: window.innerWidth / 2,
    y: 0,
  }
  const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextMenuClickOrigin, setContextMenuClickOrigin] = useState(
    defaultOriginCoordinates,
  )
  const workspaceDivRef = useRef<HTMLDivElement | null>(null)
  const [spaceIsPressed, setSpaceIsPressed] = useState(false)
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [panOrigin, setPanOrigin] = useState<{ x: number; y: number } | null>(
    null,
  )
  const pointerEventCache = useRef<PointerEvent[]>([])
  const previousPointerDiff = useRef(-1)

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

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        return
      }
      if (event.touches.length === 1 && panOrigin && isGrabbing) {
        setScreenOffset({
          x: event.touches[0].screenX * scale - panOrigin.x,
          y: event.touches[0].screenY * scale - panOrigin.y,
        })
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      pointerEventCache.current.push(event)
      if (event.button === 1 || event.button === 0) {
        setIsGrabbing(true)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const index = pointerEventCache.current.findIndex(
        (cachedEvent) => cachedEvent.pointerId === event.pointerId,
      )
      pointerEventCache.current[index] = event

      if (pointerEventCache.current.length === 2) {
        const currentDiff = Math.max(
          Math.abs(
            pointerEventCache.current[0].clientX -
              pointerEventCache.current[1].clientX,
          ),
          Math.abs(
            pointerEventCache.current[0].clientY -
              pointerEventCache.current[1].clientY,
          ),
        )

        if (previousPointerDiff.current > 0) {
          if (currentDiff > previousPointerDiff.current) {
            setScale((prev) => clamp(prev - 0.05, 1, 4))
          }
          if (currentDiff < previousPointerDiff.current) {
            setScale((prev) => clamp(prev + 0.05, 1, 4))
          }
        }

        previousPointerDiff.current = currentDiff
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      pointerEventCache.current = pointerEventCache.current.filter(
        (pointerEvent) => pointerEvent.pointerId !== event.pointerId,
      )
      if (pointerEventCache.current.length < 2) {
        previousPointerDiff.current = -1
      }
      setIsGrabbing(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    workspaceDiv.addEventListener('wheel', onWheel, { passive: false })
    workspaceDiv.addEventListener('touchmove', onTouchMove, { passive: false })
    workspaceDiv.addEventListener('pointerdown', onPointerDown)
    workspaceDiv.addEventListener('pointermove', onPointerMove)
    workspaceDiv.addEventListener('pointerup', onPointerUp)
    workspaceDiv.addEventListener('pointercancel', onPointerUp)
    workspaceDiv.addEventListener('pointerout', onPointerUp)
    workspaceDiv.addEventListener('pointerleave', onPointerUp)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      workspaceDiv.removeEventListener('wheel', onWheel)
      workspaceDiv.removeEventListener('touchmove', onTouchMove)
      workspaceDiv.removeEventListener('pointerdown', onPointerDown)
      workspaceDiv.removeEventListener('pointermove', onPointerMove)
      workspaceDiv.removeEventListener('pointerup', onPointerUp)
      workspaceDiv.removeEventListener('pointercancel', onPointerUp)
      workspaceDiv.removeEventListener('pointerout', onPointerUp)
      workspaceDiv.removeEventListener('pointerleave', onPointerUp)
    }
  }, [
    isGrabbing,
    panOrigin,
    scale,
    screenOffset.x,
    screenOffset.y,
    setScale,
    setScreenOffset,
  ])

  return (
    <>
      <ContextMenu
        open={contextMenuOpen}
        clickOrigin={contextMenuClickOrigin}
        onDismiss={() => setContextMenuOpen(false)}
      >
        <div className="*:*:shadow">
          <ModuleListAdd
            modules={modules}
            onSelect={() => {
              setContextMenuOpen(false)
            }}
          />
        </div>
      </ContextMenu>
      <Toolbar
        menuContent={
          <ModuleListAdd
            modules={modules}
            onSelect={() => {
              setIsToolbarMenuOpen(false)
            }}
          />
        }
        toolbarContent={
          <>
            <Button
              onClick={() => {
                removeAllModules()
                setIsToolbarMenuOpen(false)
              }}
            >
              Clear Workspace
            </Button>
            <Button
              onClick={() => {
                setScale(1)
                setScreenOffset({ x: 0, y: 0 })
                setIsToolbarMenuOpen(false)
              }}
            >
              Reset view
            </Button>
          </>
        }
        onOpenToolbarMenu={() => setIsToolbarMenuOpen(true)}
        onCloseToolbarMenu={() => setIsToolbarMenuOpen(false)}
        isToolbarMenuOpen={isToolbarMenuOpen}
      />
      <div
        ref={workspaceDivRef}
        className={clsx(
          'fixed flex flex-col w-screen h-screen top-0 left-0 select-none bg-zinc-100 dark:bg-zinc-900 touch-none',
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
        onTouchStart={(event) => {
          if (event.touches.length !== 1) {
            return
          }
          setIsGrabbing(true)
          setPanOrigin({
            x: event.touches[0].screenX * scale - screenOffset.x,
            y: event.touches[0].screenY * scale - screenOffset.y,
          })
        }}
        onTouchEnd={() => {
          setIsGrabbing(false)
        }}
        onTouchCancel={() => {
          setIsGrabbing(false)
        }}
      >
        <div
          className="relative size-full"
          style={{
            transform: `scale(${1 / scale}) translate(${screenOffset.x}px, ${screenOffset.y}px)`,
          }}
        >
          {modules.length > 0 ? (
            modules.map((module) => {
              switch (module.type) {
                case 'oscillator':
                  return (
                    <Tile
                      key={`tile_${module.id}`}
                      id={`tile_${module.id}`}
                      initialPos={translateCoordinates(
                        {
                          ...defaultOriginCoordinates,
                          x: defaultOriginCoordinates.x - module.size.hp / 2,
                        },
                        screenOffset,
                      )}
                      scale={scale}
                      header={module.name}
                      size={module.size}
                    >
                      <Oscillator key={module.id} moduleData={module} />
                    </Tile>
                  )
                case 'lfo':
                  return (
                    <Tile
                      key={`tile_${module.id}`}
                      id={`tile_${module.id}`}
                      initialPos={translateCoordinates(
                        {
                          ...defaultOriginCoordinates,
                          x: defaultOriginCoordinates.x - module.size.hp / 2,
                        },
                        screenOffset,
                      )}
                      scale={scale}
                      header={module.name}
                      size={module.size}
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
                        {
                          ...defaultOriginCoordinates,
                          x: defaultOriginCoordinates.x - module.size.hp / 2,
                        },
                        screenOffset,
                      )}
                      scale={scale}
                      header={module.name}
                      size={module.size}
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
                        {
                          ...defaultOriginCoordinates,
                          x: defaultOriginCoordinates.x - module.size.hp / 2,
                        },
                        screenOffset,
                      )}
                      scale={scale}
                      header={module.name}
                      size={module.size}
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
                        {
                          ...defaultOriginCoordinates,
                          x: defaultOriginCoordinates.x - module.size.hp / 2,
                        },
                        screenOffset,
                      )}
                      scale={scale}
                      header={module.name}
                      size={module.size}
                    >
                      <Filter key={module.id} moduleData={module} />
                    </Tile>
                  )
              }
            })
          ) : (
            <div
              className="text-white flex size-full justify-center flex-col text-center"
              style={{
                transform: `scale(${1 * scale})`,
              }}
            >
              <p>
                Add modules from the menu
                <span className="hidden md:inline">
                  {' '}
                  or right-click on the workspace
                </span>
                .
              </p>
            </div>
          )}
          <div
            className="absolute -z-10 top-0 left-0 rounded-md bg-[url('/rail-background.webp')]"
            style={{
              width: `${RACK_HP * HP_1}px`,
              height: `${RACK_U * U_1}px`,
            }}
          />
        </div>
      </div>
      <div className="fixed w-full left-0 bottom-0 z-10 p-2">
        <SequencerPanel />
      </div>
      {/* <CursorDebug scale={scale} offset={screenOffset} /> */}
    </>
  )
}
