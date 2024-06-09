import * as Tone from 'tone'

export function DestinationSelect({
  destinations,
  initialValue,
  onChange,
}: {
  destinations: { id: string; name: string; node: Tone.OutputNode }[]
  initialValue?: string
  onChange: (value: string) => void
}) {
  const initialDestination = destinations.find(
    (destination) => destination.id === initialValue,
  )
  return (
    <select
      defaultValue={initialDestination?.id}
      onChange={(event) => onChange(event.target.value)}
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
