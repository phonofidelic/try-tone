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
