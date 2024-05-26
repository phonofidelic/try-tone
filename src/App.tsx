import { useRef } from 'react'
import * as Tone from 'tone'
import './App.css'

function App() {
  const synth = useRef(new Tone.Synth().toDestination())

  if (!synth.current) {
    return null
  }

  return (
    <>
      <div className="card">
        <button onClick={() => synth.current.triggerAttackRelease('C4', '8n')}>
          test
        </button>
      </div>
    </>
  )
}

export default App
