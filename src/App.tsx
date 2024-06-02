import { useState } from 'react'
import { Oscillator } from './Oscillator'
import './App.css'

type OscillatorData = {
  id: string
  name: string
}

function App() {
  const [count, setCount] = useState(1)

  const onRemoveOscillator = (id: string) => {
    setOscillators(oscillators.filter((oscillator) => oscillator.id !== id))
  }

  const [oscillators, setOscillators] = useState<OscillatorData[]>(() => [
    {
      id: crypto.randomUUID(),
      name: 'Oscillator 1',
    },
  ])

  return (
    <div className="flex space-x-2">
      {oscillators.map((oscillator) => (
        <Oscillator
          key={oscillator.id}
          id={oscillator.id}
          name={oscillator.name}
          onRemove={onRemoveOscillator}
        />
      ))}
      <button
        onClick={() => {
          setCount(count + 1)
          setOscillators([
            ...oscillators,
            {
              id: crypto.randomUUID(),
              name: `Oscillator ${count + 1}`,
            },
          ])
        }}
      >
        Add Oscillator
      </button>
    </div>
  )
}

export default App
