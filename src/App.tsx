/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import * as Tone from 'tone'
import { TransportClass } from 'tone/build/esm/core/clock/Transport'
import { Analytics } from '@vercel/analytics/react'
import { Workspace, WorkspaceContextProvider } from './components/Workspace'
import { ModulesContextProvider } from './ModulesContext'
import { AudioNodeContextProvider } from './AudioNodeContext'

const TransportContext = createContext<TransportClass | null>(null)

function TransportContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <TransportContext.Provider value={Tone.getTransport()}>
      {children}
    </TransportContext.Provider>
  )
}

export function useTransport() {
  const transport = useContext(TransportContext)

  if (!transport) {
    throw new Error(
      '`useTransport` must be used within a TransportContextProvider',
    )
  }

  transport.debug = true
  return transport
}

function App() {
  return (
    <TransportContextProvider>
      <ModulesContextProvider>
        <AudioNodeContextProvider>
          <WorkspaceContextProvider>
            <Workspace />
          </WorkspaceContextProvider>
          <Analytics />
        </AudioNodeContextProvider>
      </ModulesContextProvider>
    </TransportContextProvider>
  )
}

export default App
