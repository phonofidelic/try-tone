import { ALPHA_NAMES, MIDI_FLAT_NAMES, MIDI_SHARP_NAMES } from './constants'

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

export const translateCoordinates = (
  coordinates: Record<'x' | 'y', number>,
  offset: Record<'x' | 'y', number>,
) => ({
  x: coordinates.x - offset.x,
  y: coordinates.y - offset.y,
})

// https://medium.com/geekculture/creating-a-step-sequencer-with-tone-js-32ea3002aaf5
export const makeGrid = (notes: string[]) => {
  // const notes = ['F4', 'Eb4', 'C4', 'Bb3', 'Ab3', 'F3']
  const rows = []

  for (const note of notes) {
    rows.push({
      id: crypto.randomUUID(),
      value: Array.from({ length: 8 }, () => ({
        id: crypto.randomUUID(),
        note: note,
        isActive: false,
        isPlaying: false,
      })),
    })
  }

  return rows.reverse()
}
function noteNameToMIDI(noteName: string) {
  let i
  let MIDInumber = -1 // default if not found
  // check both arrays for the noteName
  for (i = 0; i < MIDI_SHARP_NAMES.length; i++) {
    if (noteName === MIDI_SHARP_NAMES[i] || noteName === MIDI_FLAT_NAMES[i]) {
      MIDInumber = i // found it
    }
  }
  return Number(MIDInumber) // it should be a number already, but...
}
export function makeScale(scaleFormula: number[], keyNameAndOctave: string) {
  const startingName = keyNameAndOctave
  let offset = 0
  for (let i = 0; i < ALPHA_NAMES.length; i++) {
    if (startingName.includes(ALPHA_NAMES[i])) {
      offset = i
      break
    }
  }
  const startingNote = noteNameToMIDI(keyNameAndOctave)
  const myScaleFormula = scaleFormula
  const myScale = []
  for (let i = 0; i < myScaleFormula.length; i++) {
    if (
      MIDI_SHARP_NAMES[myScaleFormula[i] + startingNote].includes(
        ALPHA_NAMES[(offset + i) % ALPHA_NAMES.length],
      )
    ) {
      myScale.push(MIDI_SHARP_NAMES[myScaleFormula[i] + startingNote])
    } else if (
      MIDI_FLAT_NAMES[myScaleFormula[i] + startingNote].includes(
        ALPHA_NAMES[(offset + i) % ALPHA_NAMES.length],
      )
    ) {
      myScale.push(MIDI_FLAT_NAMES[myScaleFormula[i] + startingNote])
    } else {
      myScale.push('C7') // high note used to indicate error
    }
  }
  return myScale
}

export function numericalDegreesStringToScaleArray(scaleString: string) {
  return scaleString
    .split('-')
    .map((numericalDegree) => parseInt(numericalDegree) - 1)
}
