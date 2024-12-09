import { createContext, useContext } from 'react'
import * as Tone from 'tone'
import { Dexie, type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { makeGrid } from './utils'

export type ModuleType = 'oscillator' | 'vca' | 'envelope' | 'filter' | 'lfo'

export type ModuleData<T> = {
  id: string
  name: string
  sources: string[]
  destinations: string[]
  type: T
  size: {
    u: number
    hp: number
  }
} & (
  | {
      type: 'oscillator'
      settings: {
        frequency: number
        type: Tone.ToneOscillatorType
      }
    }
  | {
      type: 'vca'
      settings: {
        volume: number
      }
    }
  | {
      type: 'envelope'
      settings: {
        attack: number
        decay: number
        sustain: number
        release: number
      }
    }
  | {
      type: 'filter'
      settings: {
        frequency: number
        type: 'highpass' | 'bandpass' | 'lowpass'
        rolloff: Tone.FilterRollOff
      }
    }
  | {
      type: 'lfo'
      settings: {
        frequency: number
        type: Tone.ToneOscillatorType
      }
    }
)

export type SequencerData = {
  id: string
  name: string
  sequence: ReturnType<typeof makeGrid> | null
  pitchNodeId: string
  gateNodeId: string
  baseNote: string | null
  octave: string | null
  scale: string | null
  created: number
}

type ModulesContextValue = {
  modules: ModuleData<ModuleType>[]
  addModule: (newModule: ModuleData<ModuleType>) => void
  editModule<TModuleType>(
    moduleId: string,
    update: Partial<ModuleData<TModuleType>>,
  ): void
  removeModule: (moduleId: string) => void
  removeAllModules: () => void
  sequencers: SequencerData[]
  addSequencer: (newSequencer: SequencerData) => void
  editSequencer: (sequencerId: string, update: Partial<SequencerData>) => void
  removeSequencer: (sequencerId: string) => void
}

const ModulesContext = createContext<ModulesContextValue | null>(null)

const db = new Dexie('ModuleDatabase') as Dexie & {
  modules: EntityTable<ModuleData<ModuleType>, 'id'>
  sequencers: EntityTable<SequencerData, 'id'>
}
db.version(1).stores({
  modules: '++id',
  sequencers: '++id, created',
})

export function ModulesContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const modules = useLiveQuery<ModuleData<ModuleType>[], null>(
    () => db.modules.toArray(),
    [],
    null,
  )

  const addModule = async (newModule: ModuleData<ModuleType>) => {
    await db.modules.add(newModule)
  }

  async function editModule<TModuleType>(
    moduleId: string,
    update: Partial<ModuleData<TModuleType>>,
  ) {
    await db.modules.update(moduleId, { ...update })
  }

  const removeModule = async (moduleId: string) => {
    await db.modules.delete(moduleId)
  }

  const removeAllModules = async () => {
    await db.modules.clear()
  }

  const addSequencer = async (newSequencer: SequencerData) => {
    await db.sequencers.add(newSequencer)
  }

  const editSequencer = async (
    sequencerId: string,
    update: Partial<SequencerData>,
  ) => {
    await db.sequencers.update(sequencerId, { ...update })
  }

  const removeSequencer = async (sequencerId: string) => {
    await db.sequencers.delete(sequencerId)
  }

  const sequencers = useLiveQuery<SequencerData[], []>(
    () => db.sequencers.orderBy('created').toArray(),
    [],
    [],
  )

  if (!modules) {
    return null
  }

  return (
    <ModulesContext.Provider
      value={{
        modules,
        addModule,
        editModule,
        removeModule,
        removeAllModules,
        sequencers,
        addSequencer,
        editSequencer,
        removeSequencer,
      }}
    >
      {children}
    </ModulesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModules() {
  const workspaceContext = useContext(ModulesContext)

  if (!workspaceContext) {
    throw new Error(
      'useWorkspace must be used within a WorkspaceContextProvider',
    )
  }

  return workspaceContext
}
