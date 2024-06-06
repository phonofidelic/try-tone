import { createContext, useContext, useRef, useState } from 'react'
import * as Tone from 'tone'
import { Oscillator } from './Oscillator'
import './App.css'
import { Vca } from './Vca'
import { Envelope } from './Envelope'

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

type VoiceContextValue = {
  mixer: MixerData
  oscillators: OscillatorData[]
  vcas: VcaData[]
  envelopes: EnvelopeData[]
  addOscillator: () => void
  removeOscillator: (id: string) => void
  addVca: () => void
  removeVca: (id: string) => void
  addEnvelope: () => void
  removeEnvelope: (id: string) => void
}

const VoiceContext = createContext<VoiceContextValue | null>(null)

function VoiceContexProvider({ children }: { children: React.ReactNode }) {
  const mergeNode = useMixer()
  const initialOscillatorNode = new Tone.Oscillator(440, 'sine')
  const initialVcaNode = new Tone.Volume(0).connect(mergeNode)
  const initialEnvelope = new Tone.AmplitudeEnvelope().connect(mergeNode)

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

  const [envelopes, setEnvelopes] = useState([
    {
      id: crypto.randomUUID(),
      name: 'Envelope 1',
      node: initialEnvelope,
    },
  ])

  const mixer = {
    id: crypto.randomUUID(),
    name: 'Mixer',
    node: mergeNode,
  }

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

  const addEnvelope = () => {
    setEnvelopes([
      ...envelopes,
      {
        id: crypto.randomUUID(),
        name: `Envelope ${envelopes.length + 1}`,
        node: new Tone.AmplitudeEnvelope().connect(mergeNode),
      },
    ])
  }

  const removeEnvelope = (id: string) => {
    setEnvelopes(envelopes.filter((envelope) => envelope.id !== id))
  }

  return (
    <VoiceContext.Provider
      value={{
        mixer,
        oscillators,
        vcas,
        envelopes,
        addOscillator,
        removeOscillator,
        addVca,
        removeVca,
        addEnvelope,
        removeEnvelope,
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
    envelopes,
    addOscillator,
    removeOscillator,
    addVca,
    removeVca,
    addEnvelope,
    removeEnvelope,
  } = useVoice()

  return (
    <div className="grid grid-rows-3 grid-flow-col auto-cols-max gap-2">
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
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {envelopes.map((envelope) => (
          <Envelope key={envelope.id} {...envelope} onRemove={removeEnvelope} />
        ))}
        <button onClick={() => addEnvelope()}>Add Envelope</button>
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
