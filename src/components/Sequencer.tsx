import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { makeGrid } from '../utils'
import clsx from 'clsx'
import { ModuleData, useWorkspace } from './Workspace'
import { DestinationSelect } from './DestinationSelect'
import { Button } from './Button'

interface Note {
  id: string
  note: string
  isActive: boolean
}

export function Sequencer() {
  const sequence = useRef(makeGrid())
  const { nodes } = useWorkspace()
  const [destinationNode, setDestinationNode] = useState<ModuleData | null>(
    null,
  )
  const [gateNode, setGateNode] = useState<ModuleData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingIndex, setPLayingIndex] = useState(0)
  const [, setActiveNote] = useState<Note | null>(null)
  const transportRef = useRef(Tone.getTransport())
  const isRepeatScheduled = useRef(false)

  const handleClick = (clickedNote: Note) => {
    sequence.current = sequence.current.map((row) => ({
      ...row,
      value: row.value.map((note) => {
        if (note.id === clickedNote.id) {
          setActiveNote({ ...note, isActive: !note.isActive })
          return { ...note, isActive: !note.isActive }
        }
        return note
      }),
    }))
  }

  const handleDestinationChange = (id: string) => {
    setDestinationNode(nodes.find((node) => node.id === id) ?? null)
  }

  const handleGateChange = (id: string) => {
    setGateNode(nodes.find((node) => node.id === id) ?? null)
  }

  const playSequence = () => {
    if (!transportRef.current) {
      return
    }

    transportRef.current.start()
    setIsPlaying(true)
  }

  const stopSequence = () => {
    if (!transportRef.current) {
      return
    }

    transportRef.current.stop()
    setIsPlaying(false)
  }

  useEffect(() => {
    if (!transportRef.current || !destinationNode || !gateNode) {
      return
    }

    const onPlayNote = (time: Tone.Unit.Time) => {
      sequence.current.forEach((row) => {
        const note = row.value[beat]
        if (destinationNode.type === 'oscillator' && note.isActive) {
          destinationNode.node.frequency.rampTo(note.note, 0, time)
        }

        if (gateNode.type === 'envelope' && note.isActive) {
          gateNode.node.triggerAttackRelease(0.5)
        }
      })
    }

    let beat = 0
    const onRepeat = (time: Tone.Unit.Time) => {
      onPlayNote(time)
      beat = (beat + 1) % 8
      setPLayingIndex(beat)
    }

    transportRef.current.bpm.value = 120
    if (!isRepeatScheduled.current) {
      transportRef.current.scheduleRepeat(onRepeat, '8n')
      isRepeatScheduled.current = true
    }
  }, [destinationNode, gateNode])

  return (
    <div className="flex w-full space-x-2 bg-white dark:bg-zinc-800 p-2">
      <div className="flex flex-col space-y-2">
        <DestinationSelect
          destinations={nodes}
          initialValue={'not_set'}
          onChange={handleDestinationChange}
        />
        <DestinationSelect
          destinations={nodes}
          initialValue={'not_set'}
          onChange={handleGateChange}
        />
        <div>
          <Button onClick={isPlaying ? stopSequence : playSequence}>
            {isPlaying ? 'STOP' : 'START'}
          </Button>
        </div>
      </div>
      <div className="grid grid-flow-row auto-rows-max w-full ">
        {sequence.current.map((row) => (
          <div key={row.id} className="grid grid-flow-col auto-cols-fr">
            {row.value.map((item, index) => (
              <button
                key={item.id}
                className={clsx('m-1 p-1 rounded border-2', {
                  'bg-green-500/75': item.isActive,
                  'border-green-500': index === playingIndex,
                })}
                onClick={() => handleClick(item)}
              >
                {item.note}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
