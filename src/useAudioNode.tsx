import { useContext, useEffect, useState } from 'react'
import { ModuleData } from './components/Workspace'
import { ModuleNode, AudioNodeContext } from './AudioNodeContext'

// eslint-disable-next-line react-refresh/only-export-components

export function useAudioNode<TModuleType>(moduleData: ModuleData<TModuleType>) {
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

  return node
}
