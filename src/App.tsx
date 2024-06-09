import { createContext, useContext, useState } from 'react'
import * as Tone from 'tone'
import { Oscillator } from './components/Oscillator'
import './App.css'
import { Vca } from './components/Vca'
import { Envelope } from './components/Envelope'
import Tile from './components/Tile'

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

export type NodeData = {
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

type VoiceContextValue = {
  nodes: NodeData[]
  addNode: (newNode: NodeData) => void
  removeNode: (nodeId: string) => void
  connectNodes: (source: string, destination: string) => void
}

const VoiceContext = createContext<VoiceContextValue | null>(null)

function VoiceContextProvider({ children }: { children: React.ReactNode }) {
  const initialMixerData: NodeData = {
    id: crypto.randomUUID(),
    type: 'mixer',
    name: 'Mixer',
    node: new Tone.Merge().toDestination(),
    sources: [],
    destinations: ['out'],
  }

  const [nodes, setNodes] = useState<NodeData[]>([
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

  const addNode = (newNode: NodeData) => {
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
    <VoiceContext.Provider
      value={{
        nodes,
        addNode,
        removeNode,
        connectNodes,
      }}
    >
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const voiceContext = useContext(VoiceContext)

  if (!voiceContext) {
    throw new Error('useVoice must be used within a VoiceContextProvider')
  }

  return voiceContext
}

function Workspace() {
  const { nodes, addNode, removeNode, connectNodes } = useVoice()

  return (
    <div className="fixed w-screen h-screen top-0 left-0 select-none">
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
        <div className="flex w-full space-x-2 p-2">
          <button
            onClick={() => {
              const id = crypto.randomUUID()
              addNode({
                id,
                type: 'oscillator',
                name: `Oscillator ${nodes.filter((node) => node.type === 'oscillator').length + 1}`,
                node: new Tone.Oscillator(440, 'sine'),
                sources: [],
                destinations: [],
              })
            }}
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
      </div>
    </div>
  )
}

function App() {
  return (
    <VoiceContextProvider>
      <Workspace />
    </VoiceContextProvider>
  )
}

export default App
