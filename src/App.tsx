import { Workspace, WorkspaceContextProvider } from './components/Workspace'

function App() {
  return (
    <WorkspaceContextProvider>
      <Workspace />
    </WorkspaceContextProvider>
  )
}

export default App
