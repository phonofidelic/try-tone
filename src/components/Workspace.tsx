import { createContext, useContext, useState } from 'react'
import * as Tone from 'tone'
import { Toolbar } from './Toolbar'
import Tile from './Tile'
import { Oscillator } from './Oscillator'
import { Vca } from './Vca'
import { Envelope } from './Envelope'

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
)

type WorkspaceContextValue = {
  nodes: ModuleData[]
  addNode: (newNode: ModuleData) => void
  removeNode: (nodeId: string) => void
  connectNodes: (source: string, destination: string) => void
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

  return (
    <WorkspaceContext.Provider
      value={{
        nodes,
        addNode,
        removeNode,
        connectNodes,
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
  const { nodes, addNode, removeNode, connectNodes } = useWorkspace()

  return (
    <div className="fixed flex flex-col w-screen h-screen top-0 left-0 select-none">
      <Toolbar nodes={nodes} addNode={addNode} />
      <div className="relative size-full">
        {nodes.map((node) => {
          switch (node.type) {
            case 'oscillator':
              return (
                <Tile key={node.id}>
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
                <Tile key={node.id}>
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
                <Tile key={node.id}>
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
            case 'mixer':
              return null
          }
        })}
      </div>
    </div>
  )
}
