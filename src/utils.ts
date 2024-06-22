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
// an array of notes is passed in as the argument to allow for flexbility.
// const notes = ["F4", "Eb4", "C4", "Bb3", "Ab3", "F3"];

export const makeGrid = () => {
  const notes = ['F4', 'Eb4', 'C4', 'Bb3', 'Ab3', 'F3']
  // our "notation" will consist of an array with 6 sub arrays
  // each sub array corresponds to one row of our sequencer

  // declare the parent array to hold each row subarray
  const rows = []

  for (const note of notes) {
    // declare the subarray
    // const row = { id: crypto.randomUUID(), value: [] }
    // each subarray contains multiple objects that have an assigned note
    // and a boolean to flag whether they are active.
    // each element in the subarray corresponds to one eighth note.
    // for (let i = 0; i < 8; i++) {
    //   row.value.push({
    //     id: crypto.randomUUID(),
    //     note: note,
    //     isActive: false,
    //   })
    // }
    rows.push({
      id: crypto.randomUUID(),
      value: Array.from({ length: 8 }, (_item) => ({
        id: crypto.randomUUID(),
        note: note,
        isActive: false,
      })),
    })
  }

  // we now have 6 rows each containing 8 eighth notes
  return rows
}
