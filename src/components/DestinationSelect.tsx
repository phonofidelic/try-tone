import * as Tone from 'tone'

export function DestinationSelect({
  destinations,
  initialValue,
  onChange,
  className,
}: {
  destinations: { id: string; name: string; node: Tone.OutputNode }[]
  initialValue?: string
  onChange: (value: string) => void
  className?: string
}) {
  const initialDestinationId =
    initialValue === 'out'
      ? 'out'
      : destinations.find((destination) => destination.id === initialValue)?.id

  return (
    <select
      aria-label="destination"
      name="destination"
      defaultValue={initialDestinationId}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      <option value={'not_set'}>Select a destination</option>
      {destinations.map((destination) => (
        <option key={destination.id} value={destination.id}>
          {destination.name}
        </option>
      ))}
      <option value={'out'}>Out</option>
    </select>
  )
}
