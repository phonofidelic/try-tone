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
export const makeGrid = () => {
  const notes = ['F4', 'Eb4', 'C4', 'Bb3', 'Ab3', 'F3']
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

  return rows
}
