import { Workspace, WorkspaceContextProvider } from './components/Workspace'
import { AudioNodeContextProvider } from './AudioNodeContext'

function App() {
  return (
    <WorkspaceContextProvider>
      <AudioNodeContextProvider>
        <Workspace />
      </AudioNodeContextProvider>
    </WorkspaceContextProvider>
  )
}

export default App
