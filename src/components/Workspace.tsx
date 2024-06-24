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
import { clamp, translateCoordinates } from '../utils'
import { Sequencer } from './Sequencer'

export type OscillatorData = {
  id: string
  name: string
  node: Tone.Oscillator
}
export type VcaData = {
  id: string
  name: string
  node: Tone.Volume
}
export type EnvelopeData = {
  id: string
  name: string
  node: Tone.Envelope
}

export type MixerData = {
  id: string
  name: string
  node: Tone.Merge
}

export type ModuleData = {
  id: string
  name: string
  sources: string[]
  destinations: string[]
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
  nodes: ModuleData[]
  addNode: (newNode: ModuleData) => void
  removeNode: (nodeId: string) => void
  connectNodes: (source: string, destination: string) => void
  removeAllNodes: () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const initialMixerData: ModuleData = {
    id: crypto.randomUUID(),
    type: 'mixer',
    name: 'Mixer',
    node: new Tone.Merge().toDestination(),
    sources: [],
    destinations: ['out'],
  }

  const [nodes, setNodes] = useState<ModuleData[]>([
    {
      id: crypto.randomUUID(),
      type: 'oscillator',
      name: 'Oscillator 1',
      node: new Tone.Oscillator(440, 'sine').connect(initialMixerData.node),
      sources: [],
      destinations: [initialMixerData.id],
    },
    initialMixerData,
  ])

  const addNode = (newNode: ModuleData) => {
    setNodes([...nodes, newNode])
  }

  const removeNode = (nodeId: string) => {
    const nodeToRemove = nodes.find((node) => node.id === nodeId)

    if (!nodeToRemove) {
      return
    }

    const mutatedNodeList = nodes
      .map((node) => ({
        ...node,
        sources: node.sources.filter(
          (sourceId) => sourceId !== nodeToRemove.id,
        ),
        destinations: nodes
          .filter((node) => node.id !== nodeToRemove.id)
          .map((node) => node.id),
      }))
      .filter((node) => node.id !== nodeToRemove.id)

    setNodes(mutatedNodeList)
    nodeToRemove.node.disconnect().dispose()
  }

  const connectNodes = (sourceId: string, destinationId: string) => {
    const sourceNode = nodes.find((node) => node.id === sourceId)
    if (!sourceNode) {
      return
    }

    if (destinationId === 'not_set') {
      setNodes(
        nodes.map((node) =>
          node.id === sourceNode.id
            ? {
                ...sourceNode,
                destinations: ['not_set'],
              }
            : node,
        ),
      )

      sourceNode.node.disconnect()
      return
    }

    if (destinationId === 'out') {
      setNodes(
        nodes.map((node) =>
          node.id === sourceNode.id
            ? {
                ...sourceNode,
                destinations: ['out'],
              }
            : node,
        ),
      )

      sourceNode.node.disconnect()
      sourceNode.node.toDestination()
      return
    }

    const destinationNode = nodes.find((node) => node.id === destinationId)
    if (!destinationNode) {
      return
    }

    setNodes(
      nodes.map((node) => {
        if (node.id === sourceNode.id) {
          return {
            ...sourceNode,
            destinations: [destinationNode.id],
          }
        }

        if (node.id === destinationNode.id) {
          return {
            ...destinationNode,
            sources: [sourceNode.id],
          }
        }

        return node
      }),
    )

    sourceNode.node.disconnect()
    sourceNode.node.connect(destinationNode.node)
  }

  const removeAllNodes = () => {
    nodes.forEach((node) => {
      node.node.disconnect().dispose()
    })
    setNodes([])
  }

  return (
    <WorkspaceContext.Provider
      value={{
        nodes,
        addNode,
        removeNode,
        connectNodes,
        removeAllNodes,
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
  const { nodes, addNode, removeNode, connectNodes, removeAllNodes } =
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
            nodes={nodes}
            addNode={addNode}
            onSelect={() => {
              setContextMenuOpen(false)
            }}
          />
        </div>
      </ContextMenu>
      <div className="fixed top-0 flex w-screen p-2 z-10">
        <div className="flex space-x-2">
          <Toolbar nodes={nodes} addNode={addNode} />
        </div>
        <div className="flex w-full space-x-2 justify-end">
          <Button
            onClick={() => {
              removeAllNodes()
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
          {nodes.map((node) => {
            switch (node.type) {
              case 'oscillator':
                return (
                  <Tile
                    key={node.id}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Oscillator
                      key={node.id}
                      id={node.id}
                      name={node.name}
                      node={node.node}
                      onRemove={removeNode}
                      onConnect={(destinationId) =>
                        connectNodes(node.id, destinationId)
                      }
                    />
                  </Tile>
                )
              case 'vca':
                return (
                  <Tile
                    key={node.id}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Vca
                      key={node.id}
                      id={node.id}
                      name={node.name}
                      node={node.node}
                      onRemove={removeNode}
                      onConnect={(destinationId) =>
                        connectNodes(node.id, destinationId)
                      }
                    />
                  </Tile>
                )
              case 'envelope':
                return (
                  <Tile
                    key={node.id}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Envelope
                      key={node.id}
                      id={node.id}
                      name={node.name}
                      node={node.node}
                      onRemove={removeNode}
                      onConnect={(destinationId) =>
                        connectNodes(node.id, destinationId)
                      }
                    />
                  </Tile>
                )
              case 'filter':
                return (
                  <Tile
                    key={node.id}
                    initialPos={translateCoordinates(
                      defaultOriginCoordinates,
                      screenOffset,
                    )}
                    scale={scale}
                  >
                    <Filter
                      key={node.id}
                      id={node.id}
                      name={node.name}
                      node={node.node}
                      onRemove={removeNode}
                      onConnect={(destinationId) =>
                        connectNodes(node.id, destinationId)
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
