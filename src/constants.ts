export const OCTAVES = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/* https://musiclaboratory.net/5-music-scales */
export const SCALES = [
  'Standard major.1-3-5-6-8-10-12-13',
  'Pentatonic major.1-3-5-8-10',
  'Blues major.1-4-6-7-8-10',
  'Standard minor.1-3-4-6-8-9-11',
  'Melodic minor.1-3-4-6-8-10-12-13',
  'Harmonic minor.1-3-4-6-8-9-12-13',
  'Pentatonic minor.1-4-6-8-11',
  'Blues minor.1-4-6-7-8-11',
]

/* https://www.guitarland.com/MusicTheoryWithToneJS/PlayMajorScale.html */
export const ALPHA_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
export const MIDI_NUM_NAMES = [
  'C_1',
  'C#_1',
  'D_1',
  'D#_1',
  'E_1',
  'F_1',
  'F#_1',
  'G_1',
  'G#_1',
  'A_1',
  'A#_1',
  'B_1',
  'C0',
  'C#0',
  'D0',
  'D#0',
  'E0',
  'F0',
  'F#0',
  'G0',
  'G#0',
  'A0',
  'A#0',
  'B0',
  'C1',
  'C#1',
  'D1',
  'D#1',
  'E1',
  'F1',
  'F#1',
  'G1',
  'G#1',
  'A1',
  'A#1',
  'B1',
  'C2',
  'C#2',
  'D2',
  'D#2',
  'E2',
  'F2',
  'F#2',
  'G2',
  'G#2',
  'A2',
  'A#2',
  'B2',
  'C3',
  'C#3',
  'D3',
  'D#3',
  'E3',
  'F3',
  'F#3',
  'G3',
  'G#3',
  'A3',
  'A#3',
  'B3',
  'C4',
  'C#4',
  'D4',
  'D#4',
  'E4',
  'F4',
  'F#4',
  'G4',
  'G#4',
  'A4',
  'A#4',
  'B4',
  'C5',
  'C#5',
  'D5',
  'D#5',
  'E5',
  'F5',
  'F#5',
  'G5',
  'G#5',
  'A5',
  'A#5',
  'B5',
  'C6',
  'C#6',
  'D6',
  'D#6',
  'E6',
  'F6',
  'F#6',
  'G6',
  'G#6',
  'A6',
  'A#6',
  'B6',
  'C7',
  'C#7',
  'D7',
  'D#7',
  'E7',
  'F7',
  'F#7',
  'G7',
  'G#7',
  'A7',
  'A#7',
  'B7',
  'C8',
  'C#8',
  'D8',
  'D#8',
  'E8',
  'F8',
  'F#8',
  'G8',
  'G#8',
  'A8',
  'A#8',
  'B8',
  'C9',
  'C#9',
  'D9',
  'D#9',
  'E9',
  'F9',
  'F#9',
  'G9',
] as const
export const MIDI_SHARP_NAMES = [
  'B#_0',
  'C#_1',
  'Cx_1',
  'D#_1',
  'E_1',
  'E#_1',
  'F#_1',
  'Fx_1',
  'G#_1',
  'Gx_1',
  'A#_1',
  'B_1',
  'B#_1',
  'C#0',
  'Cx0',
  'D#0',
  'E0',
  'E#0',
  'F#0',
  'Fx0',
  'G#0',
  'Gx0',
  'A#0',
  'B0',
  'B#0',
  'C#1',
  'Cx1',
  'D#1',
  'E1',
  'E#1',
  'F#1',
  'Fx1',
  'G#1',
  'Gx1',
  'A#1',
  'B1',
  'B#1',
  'C#2',
  'Cx2',
  'D#2',
  'E2',
  'E#2',
  'F#2',
  'Fx2',
  'G#2',
  'Gx2',
  'A#2',
  'B2',
  'B#2',
  'C#3',
  'Cx3',
  'D#3',
  'E3',
  'E#3',
  'F#3',
  'Fx3',
  'G#3',
  'Gx3',
  'A#3',
  'B3',
  'B#3',
  'C#4',
  'Cx4',
  'D#4',
  'E4',
  'E#4',
  'F#4',
  'Fx4',
  'G#4',
  'Gx4',
  'A#4',
  'B4',
  'B#4',
  'C#5',
  'Cx5',
  'D#5',
  'E5',
  'E#5',
  'F#5',
  'Fx5',
  'G#5',
  'Gx5',
  'A#5',
  'B5',
  'B#5',
  'C#6',
  'Cx6',
  'D#6',
  'E6',
  'E#6',
  'F#6',
  'Fx6',
  'G#6',
  'Gx6',
  'A#6',
  'B6',
  'B#6',
  'C#7',
  'Cx7',
  'D#7',
  'E7',
  'E#7',
  'F#7',
  'Fx7',
  'G#7',
  'Gx7',
  'A#7',
  'B7',
  'B#7',
  'C#8',
  'Cx8',
  'D#8',
  'E8',
  'E#8',
  'F#8',
  'Fx8',
  'G#8',
  'Gx8',
  'A#8',
  'B8',
  'B#8',
  'C#9',
  'Cx9',
  'D#9',
  'E9',
  'E#9',
  'F#9',
  'Fx9',
] as const
export const MIDI_FLAT_NAMES = [
  'C_1',
  'Db_1',
  'D_1',
  'Eb_1',
  'Fb_1',
  'F_1',
  'Gb_1',
  'G_1',
  'Ab_1',
  'A_1',
  'Bb_1',
  'Cb0',
  'C0',
  'Db0',
  'D0',
  'Eb0',
  'Fb0',
  'F0',
  'Gb0',
  'G0',
  'Ab0',
  'A0',
  'Bb0',
  'Cb1',
  'C1',
  'Db1',
  'D1',
  'Eb1',
  'Fb1',
  'F1',
  'Gb1',
  'G1',
  'Ab1',
  'A1',
  'Bb1',
  'Cb2',
  'C2',
  'Db2',
  'D2',
  'Eb2',
  'Fb2',
  'F2',
  'Gb2',
  'G2',
  'Ab2',
  'A2',
  'Bb2',
  'Cb3',
  'C3',
  'Db3',
  'D3',
  'Eb3',
  'Fb3',
  'F3',
  'Gb3',
  'G3',
  'Ab3',
  'A3',
  'Bb3',
  'Cb4',
  'C4',
  'Db4',
  'D4',
  'Eb4',
  'Fb4',
  'F4',
  'Gb4',
  'G4',
  'Ab4',
  'A4',
  'Bb4',
  'Cb5',
  'C5',
  'Db5',
  'D5',
  'Eb5',
  'Fb5',
  'F5',
  'Gb5',
  'G5',
  'Ab5',
  'A5',
  'Bb5',
  'Cb6',
  'C6',
  'Db6',
  'D6',
  'Eb6',
  'Fb6',
  'F6',
  'Gb6',
  'G6',
  'Ab6',
  'A6',
  'Bb6',
  'Cb7',
  'C7',
  'Db7',
  'D7',
  'Eb7',
  'Fb7',
  'F7',
  'Gb7',
  'G7',
  'Ab7',
  'A7',
  'Bb7',
  'Cb8',
  'C8',
  'Db8',
  'D8',
  'Eb8',
  'Fb8',
  'F8',
  'Gb8',
  'G8',
  'Ab8',
  'A8',
  'Bb8',
  'Cb9',
  'C9',
  'Db9',
  'D9',
  'Eb9',
  'Fb9',
  'F9',
  'Gb9',
  'G9',
] as const

/**
 * 1 vertical rack unit
 */
export const U_1 = 162

/**
 * 1 horizontal pitch unit
 */
export const HP_1 = 19

export const frequencyRange = {
  oscillator: {
    min: 20,
    max: 16000,
    step: 0.1,
  },
  lfo: {
    min: 0.01,
    max: 20,
    step: 0.0001,
  },
  filter: {
    min: 0.1,
    max: 20000,
    step: 0.1,
  },
}
