/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import * as Tone from 'tone'
import { Analytics } from '@vercel/analytics/react'
import { Workspace, WorkspaceContextProvider } from './components/Workspace'
import { AudioNodeContextProvider } from './AudioNodeContext'
import { TransportClass } from 'tone/build/esm/core/clock/Transport'

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
      <WorkspaceContextProvider>
        <AudioNodeContextProvider>
          <Workspace />
          <Analytics />
        </AudioNodeContextProvider>
      </WorkspaceContextProvider>
    </TransportContextProvider>
  )
}

export default App
