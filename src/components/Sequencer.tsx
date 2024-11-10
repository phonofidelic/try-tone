import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import {
  makeGrid,
  makeScale,
  numericalDegreesStringToScaleArray,
} from '../utils'
import clsx from 'clsx'
import { ModuleType, SequencerData, useWorkspace } from './Workspace'
import { DestinationSelect } from './DestinationSelect'
import { Button } from './Button'
import { ALPHA_NAMES, OCTAVES, SCALES } from '../constants'
import { ModuleNode, useAudioNodes } from '../AudioNodeContext'
import { EditIcon, CloseIcon } from './Icons'
import { useTransport } from '../App'

const DEFAULT_BPM = 60

interface Note {
  id: string
  beatIndex: number
  note: string
  isActive: boolean
}

export function SequencerPanel() {
  const { sequencers, addSequencer } = useWorkspace()
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSequencer, setSelectedSequencer] =
    useState<SequencerData | null>(sequencers[0] ?? null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingIndex, setPlayingIndex] = useState(0)
  const [bpm, setBpm] = useState(DEFAULT_BPM)

  return (
    <div
      className={clsx(
        'relative flex flex-col md:flex-row w-full gap-x-2 bg-white dark:bg-zinc-800 p-2 border border-zinc-200 rounded transition-all',
        {
          'h-fit': isExpanded,
          'h-0 ': !isExpanded,
        },
      )}
    >
      <div className="absolute left-0 -top-[50px] flex space-x-2">
        {sequencers.map((sequencer) => (
          <SequencerTabButton
            key={sequencer.id}
            sequencer={sequencer}
            selectedSequencer={selectedSequencer}
            setSelectedSequencer={(sequencer: SequencerData) => {
              setSelectedSequencer(sequencer)
            }}
            setIsExpanded={setIsExpanded}
          />
        ))}
        <Button
          onClick={() => {
            const newSequencer = {
              id: crypto.randomUUID(),
              name: `Sequencer ${sequencers.length + 1}`,
              pitchNodeId: 'not_set',
              gateNodeId: 'not_set',
              baseNote: null,
              octave: null,
              scale: null,
              sequence: null,
              created: Date.now(),
            }

            addSequencer(newSequencer)
            setSelectedSequencer(newSequencer)
            setIsExpanded(true)
          }}
        >
          + Add Sequencer
        </Button>
      </div>
      <div
        className={clsx('flex w-full gap-y-2 p-2 transition-all', {
          'opacity-100': isExpanded,
          'opacity-0': !isExpanded,
        })}
      >
        {sequencers.map((sequencer) => (
          <div
            key={sequencer.id}
            className={clsx('flex w-full gap-x-2', {
              hidden: sequencer.id !== selectedSequencer?.id,
            })}
          >
            <Sequencer
              sequencerData={sequencer}
              bpm={bpm}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              playingIndex={playingIndex}
              setPlayingIndex={setPlayingIndex}
              onBpmChange={(value) => setBpm(value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sequencer({
  sequencerData,
  bpm,
  isPlaying,
  setIsPlaying,
  playingIndex,
  setPlayingIndex,
  onBpmChange,
}: {
  sequencerData: SequencerData
  bpm: number
  isPlaying: boolean
  setIsPlaying: (state: boolean) => void
  playingIndex: number
  setPlayingIndex: (index: number) => void
  onBpmChange: (bpm: number) => void
}) {
  const sequencerRef = useRef<SequencerData>(sequencerData)
  const { id, baseNote, octave, scale, pitchNodeId, gateNodeId } =
    sequencerRef.current
  const { modules, editSequencer } = useWorkspace()
  const { getNode } = useAudioNodes()
  const transport = useTransport()

  const [destinationNode, setDestinationNode] = useState<
    ModuleNode<ModuleType> | undefined
  >(getNode(pitchNodeId))
  const [gateNode, setGateNode] = useState<ModuleNode<ModuleType> | undefined>(
    getNode(gateNodeId),
  )

  const beatRef = useRef(0)
  const repeatRef = useRef<number | null>(null)

  const toggleNote = (clickedNote: Note) => {
    if (!sequencerRef.current.sequence) {
      return
    }

    const updatedSequencer = {
      ...sequencerRef.current,
      sequence: sequencerRef.current.sequence.map((row) => ({
        ...row,
        value: row.value.map((noteCell) => {
          if (noteCell.id === clickedNote.id) {
            return { ...noteCell, isActive: !noteCell.isActive }
          }
          if (noteCell.beatIndex === clickedNote.beatIndex) {
            return { ...noteCell, isActive: false }
          }
          return noteCell
        }),
      })),
    }
    sequencerRef.current = updatedSequencer
    editSequencer(id, updatedSequencer)
  }

  const handleDestinationChange = (pitchNodeId: string) => {
    setDestinationNode(getNode(pitchNodeId))
    editSequencer(id, { pitchNodeId })
  }

  const handleGateChange = (gateNodeId: string) => {
    setGateNode(getNode(gateNodeId))
    editSequencer(id, { gateNodeId })
  }

  const playSequence = () => {
    transport.start()
    setIsPlaying(true)
  }

  const stopSequence = () => {
    transport.pause()
    setIsPlaying(false)
  }

  const onBaseNoteChange = (baseNote: string) => {
    console.log(
      `onBaseNoteChange, \nscale: ${scale} \nbaseNote: ${baseNote} \noctave: ${octave}`,
    )
    if (baseNote === 'not_set') {
      editSequencer(id, { baseNote: null })
      sequencerRef.current = {
        ...sequencerRef.current,
        baseNote: null,
      }
      return
    }
    if (!scale || !octave) {
      editSequencer(id, { baseNote })
      sequencerRef.current = {
        ...sequencerRef.current,
        baseNote,
      }
      return
    }
    const sequence = makeGrid(
      makeScale(getScaleArray(scale), `${baseNote}${octave}`),
    )
    sequencerRef.current = {
      ...sequencerRef.current,
      baseNote,
      sequence,
    }
    editSequencer(id, { baseNote, sequence })
  }

  const onOctaveChange = (octave: string) => {
    console.log(
      `onOctaveChange, \nscale: ${scale} \nbaseNote: ${baseNote} \noctave: ${octave}`,
    )
    if (octave === 'not_set') {
      sequencerRef.current = {
        ...sequencerRef.current,
        octave: null,
      }
      editSequencer(id, { octave: null })
      return
    }
    if (!scale || !baseNote) {
      sequencerRef.current = {
        ...sequencerRef.current,
        octave,
      }
      editSequencer(id, { octave })
      return
    }
    const sequence = makeGrid(
      makeScale(getScaleArray(scale), `${baseNote}${octave}`),
    )
    sequencerRef.current = {
      ...sequencerRef.current,
      octave,
      sequence,
    }
    editSequencer(id, { octave, sequence })
  }

  const onScaleChange = (scale: string) => {
    console.log(
      `onScaleChange, \nscale: ${scale} \nbaseNote: ${baseNote} \noctave: ${octave}`,
    )
    if (scale === 'not_set') {
      sequencerRef.current = {
        ...sequencerRef.current,
        scale: null,
      }
      editSequencer(id, { scale: null })
      return
    }
    if (!baseNote || !octave) {
      sequencerRef.current = {
        ...sequencerRef.current,
        scale,
      }
      editSequencer(id, { scale })
      return
    }
    const sequence = makeGrid(
      makeScale(getScaleArray(scale), `${baseNote}${octave}`),
    )
    sequencerRef.current = {
      ...sequencerRef.current,
      scale,
      sequence,
    }
    editSequencer(id, { scale, sequence })
  }

  useEffect(() => {
    if (!destinationNode || !gateNode || repeatRef.current) {
      return
    }

    const onPlayNote = (time: Tone.Unit.Time) => {
      if (!sequencerRef.current.sequence) {
        return
      }
      sequencerRef.current.sequence.forEach((row) => {
        const note = row.value[beatRef.current]
        if (destinationNode.type === 'oscillator' && note.isActive) {
          destinationNode.data.frequency.rampTo(note.note, 0, time)
        }

        if (gateNode.type === 'envelope' && note.isActive) {
          gateNode.data.triggerAttackRelease('8n')
        }
      })
    }

    const onRepeat = (time: Tone.Unit.Time) => {
      onPlayNote(time)
      setPlayingIndex(beatRef.current)
      beatRef.current = (beatRef.current + 1) % 8
    }

    transport.bpm.value = bpm
    if (repeatRef.current === null) {
      repeatRef.current = transport.scheduleRepeat(onRepeat, '8n')
    }

    return () => {
      if (repeatRef.current) {
        transport.clear(repeatRef.current)
        repeatRef.current = null
      }
    }
  }, [
    beatRef,
    destinationNode,
    gateNode,
    repeatRef,
    setPlayingIndex,
    transport,
    bpm,
  ])

  return (
    <>
      <div className="flex flex-col gap-y-2 mt-auto overflow-y-auto w-fit">
        <label className="">
          <div className="text-xs">V/Oct out</div>
          <DestinationSelect
            className="w-full"
            destinations={modules.filter(
              (module) => module.type === 'oscillator',
            )}
            initialValue={pitchNodeId}
            onChange={handleDestinationChange}
          />
        </label>
        <label>
          <div className="text-xs">Gate out</div>
          <DestinationSelect
            className="w-full"
            destinations={modules.filter(
              (module) => module.type === 'envelope',
            )}
            initialValue={gateNodeId}
            onChange={handleGateChange}
          />
        </label>
        <label>
          <div className="text-xs">Base Note</div>
          <select
            className="w-full"
            defaultValue={baseNote ?? undefined}
            onChange={(event) => onBaseNoteChange(event.target.value)}
          >
            <option value="not_set">Select base note</option>
            {ALPHA_NAMES.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="text-xs">Octave</div>
          <select
            className="w-full"
            defaultValue={octave ?? undefined}
            onChange={(event) => onOctaveChange(event.target.value)}
          >
            <option value={'not_set'}>Select octave</option>
            {OCTAVES.map((octave) => (
              <option key={octave} value={octave}>
                {octave}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="text-xs">Scale</div>
          <select
            className="w-full"
            defaultValue={scale ?? undefined}
            onChange={(event) => onScaleChange(event.target.value)}
          >
            <option value={'not_set'}>Select a scale</option>
            {SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {scale.split('.')[0]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="text-xs">BPM: {bpm}</div>
          <input
            type="range"
            min={10}
            max={200}
            step={1}
            value={bpm}
            onChange={(event) => onBpmChange(Number(event.target.value))}
          />
        </label>
        <Button onClick={isPlaying ? stopSequence : playSequence}>
          {isPlaying ? 'STOP' : 'START'}
        </Button>
      </div>

      <div className="flex flex-col w-full overflow-y-auto">
        {!sequencerRef.current.sequence ? (
          <div className="size-full flex flex-col justify-center place-self-stretch text-center self-stretch">
            <div>Select a scale for the sequence</div>
          </div>
        ) : (
          sequencerRef.current.sequence.map((row) => (
            <div
              key={row.id}
              className="grid grid-flow-col auto-cols-fr w-full"
            >
              {row.value.map((column, index) => (
                <button
                  key={column.id}
                  className={clsx('m-1 p-1 rounded border-2', {
                    'bg-green-500/75': column.isActive,
                    'border-green-500': index === playingIndex,
                  })}
                  onClick={() => toggleNote(column)}
                >
                  {column.note}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  )
}

function SequencerTabButton({
  sequencer,
  selectedSequencer,
  setSelectedSequencer,
  setIsExpanded,
}: {
  sequencer: SequencerData
  selectedSequencer: SequencerData | null
  setSelectedSequencer(sequencer: SequencerData): void
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { editSequencer, removeSequencer } = useWorkspace()
  const [isEditing, setIsEditing] = useState(false)
  return (
    <div className="relative group">
      <Button
        onClick={() => {
          if (isEditing) {
            return
          }
          if (selectedSequencer && selectedSequencer.id === sequencer.id) {
            setIsExpanded((previous) => !previous)
          } else {
            setIsExpanded(true)
            setSelectedSequencer(sequencer)
          }
        }}
        className={clsx({
          'bg-zinc-200 underline dark:bg-zinc-900':
            selectedSequencer && selectedSequencer.id === sequencer.id,
        })}
      >
        {isEditing ? (
          <form
            onSubmit={(event) => {
              const formData = new FormData(event.target as HTMLFormElement)
              const sequencerNameUpdate = formData.get('sequencer-name')
              if (
                sequencerNameUpdate &&
                typeof sequencerNameUpdate === 'string'
              ) {
                editSequencer(sequencer.id, { name: sequencerNameUpdate })
              }
              setIsEditing(false)
            }}
          >
            <input
              type="text"
              defaultValue={sequencer.name ?? undefined}
              autoFocus
              name="sequencer-name"
              onBlur={(event) => {
                editSequencer(sequencer.id, { name: event.target.value })
                setIsEditing(false)
              }}
              autoComplete="off"
            />
          </form>
        ) : (
          sequencer.name
        )}
      </Button>
      <div className="absolute -right-2 -top-4 m-1 flex -space-x-3">
        <button
          className="hover:z-10 relative hidden border-zinc-200 rounded-full bg-white group-hover:flex group-focus-within:flex items-center justify-center"
          onClick={() => setIsEditing(true)}
          title="edit"
        >
          <EditIcon size={12} className="absolute " />
        </button>
        <button
          className="relative hidden border-zinc-200 rounded-full bg-white group-hover:flex group-focus:flex group-focus-within:flex items-center justify-center"
          onClick={() => removeSequencer(sequencer.id)}
          title="delete"
        >
          <CloseIcon size={12} className="absolute" />
        </button>
      </div>
    </div>
  )
}

const getScaleArray = (scaleString: string) => {
  const [, numericalDegreesString] = scaleString.split('.')
  if (!numericalDegreesString) {
    throw new Error(
      `getScaleArray received an invalid scale string: ${scaleString}`,
    )
  }
  return numericalDegreesStringToScaleArray(numericalDegreesString)
}
