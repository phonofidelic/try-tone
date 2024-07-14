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
import EditIcon, { CloseIcon } from './Icons'

interface Note {
  id: string
  note: string
  isActive: boolean
}

export function SequencerPanel() {
  const { sequencers, addSequencer, editSequencer, removeSequencer } =
    useWorkspace()
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSequencer, setSelectedSequencer] =
    useState<SequencerData | null>(null)

  useEffect(() => {
    setSelectedSequencer(sequencers[sequencers.length - 1])
  }, [sequencers])

  return (
    <div
      className={clsx(
        'relative flex flex-col md:flex-row w-full space-x-2 bg-white dark:bg-zinc-800 p-2 border border-zinc-200 rounded transition-all',
        {
          'h-[45vh]': isExpanded,
          'h-0 ': !isExpanded,
        },
      )}
    >
      <div className="absolute left-0 -top-[50px] flex space-x-2">
        {sequencers.map((sequencer) => (
          <SequencerButtonGroup
            key={sequencer.id}
            sequencer={sequencer}
            selectedSequencer={selectedSequencer}
            setSelectedSequencer={setSelectedSequencer}
            setIsExpanded={setIsExpanded}
            editSequencer={editSequencer}
            removeSequencer={removeSequencer}
          />
        ))}
        <Button
          onClick={() => {
            const id = crypto.randomUUID()
            addSequencer({
              id,
              name: `Sequencer ${sequencers.length + 1}`,
              baseNote: 'not_set',
              octave: 'not_set',
              pitchNodeId: 'not_set',
              gateNodeId: 'not_set',
              scale: [],
              sequence: null,
              created: Date.now(),
            })
          }}
        >
          Add Sequencer
        </Button>
      </div>
      <div
        className={clsx('flex w-full space-y-2 p-2 transition-all', {
          'opacity-100': isExpanded,
          'opacity-0': !isExpanded,
        })}
      >
        {selectedSequencer && (
          <Sequencer key={selectedSequencer.id} {...selectedSequencer} />
        )}
      </div>
    </div>
  )
}

export function Sequencer({
  id,
  baseNote,
  octave,
  scale,
  sequence,
  pitchNodeId,
  gateNodeId,
}: SequencerData) {
  const sequenceRef = useRef<ReturnType<typeof makeGrid> | null>(sequence)
  const { modules, editSequencer } = useWorkspace()
  const { getNode } = useAudioNodes()

  const [destinationNode, setDestinationNode] = useState<
    ModuleNode<ModuleType> | undefined
  >(getNode(pitchNodeId))
  const [gateNode, setGateNode] = useState<ModuleNode<ModuleType> | undefined>(
    getNode(gateNodeId),
  )

  const [isPlaying, setIsPlaying] = useState(false)
  const [playingIndex, setPLayingIndex] = useState(0)
  const [, setActiveNote] = useState<Note | null>(null)
  const transportRef = useRef(Tone.getTransport())
  const isRepeatScheduled = useRef(false)

  const handleClick = (clickedNote: Note) => {
    if (!sequenceRef.current) {
      return
    }

    sequenceRef.current = sequenceRef.current.map((row) => ({
      ...row,
      value: row.value.map((note) => {
        if (note.id === clickedNote.id) {
          setActiveNote({ ...note, isActive: !note.isActive })
          return { ...note, isActive: !note.isActive }
        }
        return note
      }),
    }))

    editSequencer(id, { sequence: sequenceRef.current })
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
    editSequencer(id, { scale: scaleArray })
  }

  useEffect(() => {
    if (octave === 'not_set' || baseNote === 'not_set' || !scale) {
      return
    }
    sequenceRef.current = makeGrid(makeScale(scale, `${baseNote}${octave}`))
  }, [baseNote, octave, scale])

  useEffect(() => {
    if (!transportRef.current || !destinationNode || !gateNode) {
      return
    }

    const onPlayNote = (time: Tone.Unit.Time) => {
      if (!sequenceRef.current) {
        return
      }
      sequenceRef.current.forEach((row) => {
        const note = row.value[beat]
        if (destinationNode.type === 'oscillator' && note.isActive) {
          destinationNode.data.frequency.rampTo(note.note, 0, time)
        }

        if (gateNode.type === 'envelope' && note.isActive) {
          gateNode.data.triggerAttackRelease(0.5)
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
    <>
      <div className="flex flex-col space-y-2 mt-auto overflow-y-auto">
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
            onChange={(event) =>
              editSequencer(id, { baseNote: event.target.value })
            }
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
            defaultValue={octave}
            onChange={(event) =>
              editSequencer(id, { octave: event.target.value })
            }
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
            onChange={(event) => onSelectScale(event.target.value)}
          >
            <option value={'not_set'}>Select a scale</option>
            {SCALES.map((scale) => (
              <option key={scale[0]} value={scale[1]}>
                {scale[0]}
              </option>
            ))}
          </select>
        </label>
        <div>
          <Button onClick={isPlaying ? stopSequence : playSequence}>
            {isPlaying ? 'STOP' : 'START'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col w-full overflow-y-auto">
        {!sequenceRef.current ? (
          <div className="size-full flex flex-col justify-center place-self-stretch text-center self-stretch">
            <div>Select a scale for the sequence</div>
          </div>
        ) : (
          sequenceRef.current.map((row) => (
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
    </>
  )
}

function SequencerButtonGroup({
  sequencer,
  selectedSequencer,
  setSelectedSequencer,
  setIsExpanded,
  editSequencer,
  removeSequencer,
}: {
  sequencer: SequencerData
  selectedSequencer: SequencerData | null
  setSelectedSequencer(sequencer: SequencerData): void
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  editSequencer(id: string, update: Partial<SequencerData>): void
  removeSequencer(id: string): void
}) {
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
          'bg-zinc-200':
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
              defaultValue={sequencer.name}
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
