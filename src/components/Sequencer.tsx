import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import {
  makeGrid,
  makeScale,
  numericalDegreesStringToScaleArray,
} from '../utils'
import clsx from 'clsx'
import { ModuleData, useWorkspace } from './Workspace'
import { DestinationSelect } from './DestinationSelect'
import { Button } from './Button'
import { ALPHA_NAMES, OCTAVES, SCALES } from '../constants'

interface Note {
  id: string
  note: string
  isActive: boolean
}

export function Sequencer() {
  const [baseNote, setBaseNote] = useState('not_set')
  const [octave, setOctave] = useState('not_set')
  const [scale, setScale] = useState<number[]>([])
  const sequence = useRef<ReturnType<typeof makeGrid> | null>(null)
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
    if (!sequence.current) {
      return
    }

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

  const onSelectScale = (numericalDegreesString: string) => {
    if (numericalDegreesString === 'not_set') {
      return
    }
    const scaleArray = numericalDegreesStringToScaleArray(
      numericalDegreesString,
    )
    setScale(scaleArray)
  }

  useEffect(() => {
    if (octave === 'not_set') {
      return
    }
    sequence.current = makeGrid(makeScale(scale, `C${octave}`))
  }, [octave, scale])

  useEffect(() => {
    if (!transportRef.current || !destinationNode || !gateNode) {
      return
    }

    const onPlayNote = (time: Tone.Unit.Time) => {
      if (!sequence.current) {
        return
      }
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
    <div className="flex flex-col md:flex-row w-full space-x-2 bg-white dark:bg-zinc-800 p-2 border rounded">
      <div className="flex h-full flex-col space-y-2 mt-auto">
        <label>
          <div className="text-xs">V/Oct out</div>
          <DestinationSelect
            destinations={nodes}
            initialValue={'not_set'}
            onChange={handleDestinationChange}
          />
        </label>
        <label>
          <div className="text-xs">Gate out</div>
          <DestinationSelect
            destinations={nodes}
            initialValue={'not_set'}
            onChange={handleGateChange}
          />
        </label>
        <label>
          <div className="text-xs">Base Note</div>
          <select onChange={(event) => setBaseNote(event.target.value)}>
            <option value="not_set">Select base note</option>
            {ALPHA_NAMES.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </label>
        {baseNote !== 'not_set' && (
          <label>
            <div className="text-xs">Octave</div>
            <select onChange={(event) => setOctave(event.target.value)}>
              <option value={'not_set'}>Select octave</option>
              {OCTAVES.map((octave) => (
                <option key={octave} value={octave}>
                  {octave}
                </option>
              ))}
            </select>
          </label>
        )}
        {octave !== 'not_set' && (
          <label>
            <div className="text-xs">Scale</div>
            <select onChange={(event) => onSelectScale(event.target.value)}>
              <option value={'not_set'}>Select a scale</option>
              {SCALES.map((scale) => (
                <option key={scale[0]} value={scale[1]}>
                  {scale[0]}
                </option>
              ))}
            </select>
          </label>
        )}
        <div>
          <Button onClick={isPlaying ? stopSequence : playSequence}>
            {isPlaying ? 'STOP' : 'START'}
          </Button>
        </div>
      </div>
      <div className="flex flex-col w-full">
        {!sequence.current ? (
          <div className="size-full flex flex-col justify-center place-self-stretch text-center self-stretch">
            <div>Select a scale for the sequence</div>
          </div>
        ) : (
          sequence.current.map((row) => (
            <div
              key={row.id}
              className="grid grid-flow-col auto-cols-fr w-full"
            >
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
          ))
        )}
      </div>
    </div>
  )
}
