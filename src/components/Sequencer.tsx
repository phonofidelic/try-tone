import { useState } from 'react'
import { makeGrid } from '../utils'
import clsx from 'clsx'

export function Sequencer() {
  const [sequence, setSequence] = useState(() => makeGrid())

  const handleClick = (noteId: string) => {
    const updatedSequence = sequence.map((row) => ({
      ...row,
      value: row.value.map((note) =>
        note.id === noteId ? { ...note, isActive: !note.isActive } : note,
      ),
    }))
    setSequence(updatedSequence)
  }

  return (
    <div className="grid grid-flow-row auto-rows-max w-full bg-white dark:bg-zinc-800">
      {sequence.map((row) => (
        <div key={row.id} className="grid grid-flow-col auto-cols-fr">
          {row.value.map((item) => (
            <button
              key={item.id}
              className={clsx('m-1 p-1 border rounded', {
                'bg-green-500/75': item.isActive,
              })}
              onClick={() => handleClick(item.id)}
            >
              {item.note}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
