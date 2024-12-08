import { useState, useRef, useEffect } from 'react'
import * as Tone from 'tone'
import { frequencyRange } from '@/constants'
import { type ModuleNode } from '@/AudioNodeContext'

export function LedIndicator({
  node,
  isRunning,
}: {
  node: ModuleNode<'oscillator' | 'lfo' | 'filter'>['data']
  isRunning: boolean
}) {
  const [indicatorValue, setIndicatorValue] = useState<number>(0)
  const intervalId = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!node || !isRunning) {
      if (intervalId.current) {
        clearInterval(intervalId.current)
      }
      return
    }

    const analyser = new Tone.Analyser('waveform', 1024)
    node.connect(analyser)

    const updateOutputValue = () => {
      const analyserData = Array.from(analyser.getValue() as Float32Array)
      const sum = analyserData.reduce((a, b) => a + b, 0)
      const average = sum / analyserData.length
      setIndicatorValue(average)
    }

    intervalId.current = setInterval(updateOutputValue, 100)

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current)
      }
      analyser.disconnect()
    }
  }, [node, isRunning])
  return (
    <div className="flex relative size-4">
      <div
        className="size-full m-auto rounded-full absolute border-2"
        style={{
          backgroundColor: `rgb(${
            (Tone.Frequency(indicatorValue).toFrequency() /
              255 /
              (frequencyRange.lfo.max / 255)) *
            255
          }, 0, 0)`,
        }}
      />
      <div
        className="size-full m-auto rounded-full bg-red-500 blur-md absolute"
        style={{ opacity: indicatorValue }}
      />
    </div>
  )
}
