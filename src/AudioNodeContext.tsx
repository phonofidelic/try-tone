import { createContext, useContext, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { ModuleData, ModuleType, useWorkspace } from './components/Workspace'
import { frequencyRange } from './constants'

export type ModuleNode<TModuleType = ModuleType> = {
  id: string
  type: TModuleType
} & (
  | {
      type: 'oscillator'
      data: Tone.Oscillator
    }
  | {
      type: 'envelope'
      data: Tone.AmplitudeEnvelope
    }
  | {
      type: 'vca'
      data: Tone.Volume
    }
  | {
      type: 'filter'
      data: Tone.Filter
    }
  | {
      type: 'lfo'
      data: Tone.LFO
    }
)

type AudioNodeContextValue = {
  nodes: ModuleNode[]
  getNode: <T>(nodeId: string) => ModuleNode<T> | undefined
}

type OscillatorOptions = ConstructorParameters<typeof Tone.Oscillator>[0]
type EnvelopeOptions = ConstructorParameters<typeof Tone.AmplitudeEnvelope>[0]
type VcaOptions = ConstructorParameters<typeof Tone.Volume>[0]
type FilterOptions = ConstructorParameters<typeof Tone.Filter>[0]

const AudioNodeContext = createContext<AudioNodeContextValue | null>(null)

export function AudioNodeContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { modules } = useWorkspace()
  const [, forceUpdate] = useState<ModuleNode[]>([])
  const nodesRef = useRef<ModuleNode[]>([])
  const [isReady, setIsReady] = useState(false)

  function getNode<T>(nodeId: string): ModuleNode<T> | undefined {
    const foundNode = nodesRef.current.find((node) => node.id === nodeId) as
      | ModuleNode<T>
      | undefined

    return foundNode
  }

  useEffect(() => {
    if (!nodesRef.current) {
      return
    }

    const updatedNodes = modules.map((module) => {
      switch (module.type) {
        case 'oscillator':
          return (
            nodesRef.current.find((node) => node.id === module.id) ?? {
              id: module.id,
              type: module.type,
              data: new Tone.Oscillator(module.settings as OscillatorOptions),
            }
          )
        case 'vca':
          return (
            nodesRef.current.find((node) => node.id === module.id) ?? {
              id: module.id,
              type: module.type,
              data: new Tone.Volume(module.settings as VcaOptions),
            }
          )
        case 'envelope':
          return (
            nodesRef.current.find((node) => node.id === module.id) ?? {
              id: module.id,
              type: module.type,
              data: new Tone.AmplitudeEnvelope(
                module.settings as EnvelopeOptions,
              ),
            }
          )
        case 'filter':
          return (
            nodesRef.current.find((node) => node.id === module.id) ?? {
              id: module.id,
              type: module.type,
              data: new Tone.Filter(module.settings as FilterOptions),
            }
          )
        case 'lfo':
          return (
            nodesRef.current.find((node) => node.id === module.id) ?? {
              id: module.id,
              type: module.type,
              data: new Tone.LFO(
                module.settings.frequency,
                frequencyRange[module.type].min,
                frequencyRange[module.type].max,
              ),
            }
          )
      }
    })
    forceUpdate(updatedNodes)
    nodesRef.current = updatedNodes
    setIsReady(true)
  }, [modules])

  if (!isReady) {
    return null
  }

  return (
    <AudioNodeContext.Provider value={{ nodes: nodesRef.current, getNode }}>
      {children}
    </AudioNodeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioNodes() {
  const audioNodeContext = useContext(AudioNodeContext)

  if (!audioNodeContext) {
    throw new Error(
      '`useAudioNodes` must be used within an AudioNodeContextProvider',
    )
  }

  return audioNodeContext
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioNode<TModuleType>(moduleData: ModuleData<ModuleType>) {
  const [node, setNode] = useState<ModuleNode<TModuleType>['data'] | undefined>(
    undefined,
  )
  const audioNodeContext = useContext(AudioNodeContext)

  if (!audioNodeContext) {
    throw new Error(
      '`useAudioNode` must be used within an AudioNodeContextProvider',
    )
  }

  useEffect(() => {
    if (!node) {
      //@ts-expect-error TODO: find out why this errors
      setNode(audioNodeContext.getNode<TModuleType>(moduleData.id)?.data)
      return
    }

    moduleData.destinations.forEach((destinationId) => {
      if (destinationId === 'out') {
        node.toDestination()
      } else {
        const destination = audioNodeContext.getNode(destinationId)
        if (destination) {
          node.connect(destination.data)
        }
      }
    })
  }, [audioNodeContext, moduleData.destinations, moduleData.id, node])

  return { node, ...audioNodeContext }
}
