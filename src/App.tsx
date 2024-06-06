import { createContext, useContext, useRef, useState } from 'react'
import * as Tone from 'tone'
import { Oscillator } from './Oscillator'
import './App.css'
import Vca from './Vca'

const MixerContext = createContext<Tone.Merge | null>(null)

function MixerContextProvider({ children }: { children: React.ReactNode }) {
  const mergeNode = useRef(new Tone.Merge().toDestination()).current

  return (
    <MixerContext.Provider value={mergeNode}>{children}</MixerContext.Provider>
  )
}

export function useMixer() {
  const mergeNode = useContext(MixerContext)

  if (!mergeNode) {
    throw new Error('useMixer must be used within a MixerContextProvider')
  }

  return mergeNode
}

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
type VoiceContextValue = {
  oscillators: OscillatorData[]
  vcas: VcaData[]
  addOscillator: () => void
  removeOscillator: (id: string) => void
  addVca: () => void
  removeVca: (id: string) => void
}

const VoiceContext = createContext<VoiceContextValue | null>(null)

function VoiceContexProvider({ children }: { children: React.ReactNode }) {
  const mergeNode = useMixer()
  const initialOscillatorNode = useRef(new Tone.Oscillator(440, 'sine')).current
  const initialVcaNode = useRef(new Tone.Volume(0).connect(mergeNode)).current

  const [oscillators, setOscillators] = useState([
    {
      id: crypto.randomUUID(),
      name: 'Oscillator 1',
      node: initialOscillatorNode,
    },
  ])

  const [vcas, setVcas] = useState([
    {
      id: crypto.randomUUID(),
      name: 'VCA 1',
      node: initialVcaNode,
    },
  ])

  const addOscillator = () => {
    const newOscillator = {
      id: crypto.randomUUID(),
      name: `Oscillator ${oscillators.length + 1}`,
      node: new Tone.Oscillator(440, 'sine'),
    }

    setOscillators([...oscillators, newOscillator])
  }

  const removeOscillator = (id: string) => {
    setOscillators(oscillators.filter((oscillator) => oscillator.id !== id))
  }

  const addVca = () => {
    const newVca = {
      id: crypto.randomUUID(),
      name: `VCA ${vcas.length + 1}`,
      node: new Tone.Volume(0).connect(mergeNode),
    }

    setVcas([...vcas, newVca])
  }

  const removeVca = (id: string) => {
    setVcas(vcas.filter((vca) => vca.id !== id))
  }

  return (
    <VoiceContext.Provider
      value={{
        oscillators,
        vcas,
        addOscillator,
        removeOscillator,
        addVca,
        removeVca,
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
  const {
    oscillators,
    vcas,
    addOscillator,
    removeOscillator,
    addVca,
    removeVca,
  } = useVoice()

  return (
    <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-2">
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {oscillators.map((oscillator) => (
          <Oscillator
            key={oscillator.id}
            {...oscillator}
            onRemove={removeOscillator}
          />
        ))}
        <button onClick={() => addOscillator()}>Add Oscillator</button>
      </div>
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {vcas.map((vca) => (
          <Vca key={vca.id} {...vca} onRemove={removeVca} />
        ))}
        <button onClick={() => addVca()}>Add VCA</button>
      </div>
    </div>
  )
}

function App() {
  return (
    <MixerContextProvider>
      <VoiceContexProvider>
        <Workspace />
      </VoiceContexProvider>
    </MixerContextProvider>
  )
}

export default App
