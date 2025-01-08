import { produce } from 'immer'
import { create } from 'zustand'

import ISO6391 from 'iso-639-1'
import { Step } from '../hooks/use-stepper'
import { storeMiddleware } from './middleware'
import { SearchProvider } from '@/lib/api/search'

export type ResourceType = 'text' | 'url' | 'file' | 'search'

export interface SearchResourceMeta {
  provider: SearchProvider
  keywords: string[]
  searchDescription: string
}

export interface Resource {
  id: string
  type: ResourceType
  content: string
  url?: string
  title?: string
  meta?: SearchResourceMeta
}

export type Resources = Resource[]

export type PodcastInfo = Omit<PodcastInfoStore, '_hasHydrated'>

export type Language = 'en' | 'zh' | 'ja' | 'fr' | 'de' | 'ko'
export const languageList: Language[] = ['en', 'zh', 'ja', 'fr', 'de', 'ko']
export const nativeLanguageList = languageList.map((lang) =>
  ISO6391.getNativeName(lang)
)

export type SpeakerNums = 1 | 2 | 3 | 4
export const speakerNumsList: SpeakerNums[] = [1, 2, 3, 4]

export type DialogueItem = { id: string; content: string; speaker: number }
export type DialogueItems = DialogueItem[]

export type RemoteSpeaker = {
  name: string
  displayName: string
  gender: string
  sample: Record<Language, string>
}
export type RemoteSpeakers = RemoteSpeaker[]

export type Speaker = {
  id: number
  provider: string
  speaker: string
  speed: number
}
export type Speakers = Speaker[]

export interface CustomModel {
  _id: string
  cover_image: string
  created_at: string
  description: string
  languages: string[]
  like_count: number
  liked: boolean
  lock_visibility: boolean
  mark_count: number
  marked: boolean
  samples: any[]
  shared_count: number
  state: string
  tags: string[]
  task_count: number
  title: string
  train_mode: string
  type: string
  updated_at: string
  visibility: string
}

export interface PodcastInfoStore {
  _hasHydrated: boolean
  resources: Resources
  step: Step
  speakerNums: number
  useSpeakerName: boolean
  speakerNames: string[]
  lang: Language
  dialogueItems: DialogueItems
  speakers: Speakers
  remoteProviderWithSpeakers: Record<string, RemoteSpeakers>
  useBgm: boolean
  autoGenBgm: boolean
  bgmPrompt: string
  bgmVolume: number
  mp3: string
  title: string
  isExtract: boolean
  genDialogPrompt: string
  isLongGenerating: boolean
  audienceChoice: number
}

export interface PodcastInfoActions {
  setResources: (
    resourcesOrUpdater: Resources | ((resources: Resources) => Resources)
  ) => void
  setSpeakerNums: (nums: number) => void
  setUseSpeakerName: (useSpeakerName: boolean) => void
  setSpeakerNames: (
    namesOrUpdater: string[] | ((names: string[]) => string[])
  ) => void
  setLang: (lang: Language) => void
  setStep: (step: Step) => void
  setRemoteProviderWithSpeakers: (
    remoteProviderWithSpeakersOrUpdater:
      | Record<string, RemoteSpeakers>
      | ((
          remoteProviderWithSpeakers: Record<string, RemoteSpeakers>
        ) => Record<string, RemoteSpeakers>)
  ) => void
  setDialogueItems: (
    itemsOrUpdater: DialogueItems | ((items: DialogueItems) => DialogueItems)
  ) => void
  setSpeakers: (
    speakersOrUpdater: Speakers | ((speakers: Speakers) => Speakers)
  ) => void
  setUseBgm: (useBgm: boolean) => void
  setAutoGenBgm: (autoGenBgm: boolean) => void
  setBgmPrompt: (bgmPrompt: string) => void
  setBgmVolume: (bgmVolume: number) => void
  setMp3: (mp3: string) => void
  updateField: <T extends keyof PodcastInfoStore>(
    field: T,
    value: PodcastInfoStore[T]
  ) => void
  updateAll: (fields: Partial<PodcastInfoStore>) => void
  setHasHydrated: (value: boolean) => void
  setTitle: (title: string) => void
  setIsExtract: (isExtract: boolean) => void
  setGenDialogPrompt: (genDialogPrompt: string) => void
  setIsLongGenerating: (isLongGenerating: boolean) => void
  setAudienceChoice: (audienceChoice: number) => void
  reset: () => void
}

export const initialState: Omit<PodcastInfoStore, '_hasHydrated'> = {
  resources: [],
  step: 'assets-selection',
  speakerNums: speakerNumsList[1],
  useSpeakerName: false,
  speakerNames: Array.from(
    { length: speakerNumsList[1] },
    (_, i) => `Speaker ${i + 1}`
  ),
  lang: 'en',
  dialogueItems: [],
  remoteProviderWithSpeakers: {},
  speakers: Array.from({ length: speakerNumsList[1] }, (_, i) => ({
    id: i + 1,
    provider: 'doubao',
    speaker: 'zh_female_shuangkuaisisi_moon_bigtts',
    speed: 1,
  })),
  useBgm: false,
  autoGenBgm: true,
  bgmPrompt: '',
  bgmVolume: -10,
  mp3: '',
  title: '',
  isExtract: false,
  genDialogPrompt: '',
  isLongGenerating: false,
  audienceChoice: 0,
}

export const usePodcastInfoStore = create<
  PodcastInfoStore & PodcastInfoActions
>()(
  storeMiddleware<PodcastInfoStore & PodcastInfoActions>(
    (set) => ({
      _hasHydrated: false,
      ...initialState,
      reset: () => set(initialState),
      setTitle: (title) =>
        set(
          produce((state) => {
            state.title = title
          })
        ),
      setUseSpeakerName: (useSpeakerName) =>
        set(
          produce((state) => {
            state.useSpeakerName = useSpeakerName
          })
        ),
      setIsExtract: (isExtract) =>
        set(
          produce((state) => {
            state.isExtract = isExtract
          })
        ),
      setGenDialogPrompt: (genDialogPrompt) =>
        set(
          produce((state) => {
            state.genDialogPrompt = genDialogPrompt
          })
        ),
      setAudienceChoice: (audienceChoice) =>
        set(
          produce((state) => {
            state.audienceChoice = audienceChoice
          })
        ),
      setBgmVolume: (bgmVolume) =>
        set(
          produce((state) => {
            state.bgmVolume = bgmVolume
          })
        ),
      setUseBgm: (useBgm) =>
        set(
          produce((state) => {
            state.useBgm = useBgm
          })
        ),
      setAutoGenBgm: (autoGenBgm) =>
        set(
          produce((state) => {
            state.autoGenBgm = autoGenBgm
          })
        ),
      setBgmPrompt: (bgmPrompt) =>
        set(
          produce((state) => {
            state.bgmPrompt = bgmPrompt
          })
        ),
      setMp3: (mp3) =>
        set(
          produce((state) => {
            state.mp3 = mp3
          })
        ),
      setRemoteProviderWithSpeakers: (remoteProviderWithSpeakersOrUpdater) =>
        set(
          produce((state) => {
            state.remoteProviderWithSpeakers =
              typeof remoteProviderWithSpeakersOrUpdater === 'function'
                ? remoteProviderWithSpeakersOrUpdater(
                    state.remoteProviderWithSpeakers
                  )
                : remoteProviderWithSpeakersOrUpdater
          })
        ),
      updateField: (field, value) =>
        set(
          produce((state) => {
            state[field] = value
          })
        ),
      setStep: (step) =>
        set(
          produce((state) => {
            state.step = step
          })
        ),
      setSpeakerNums: (nums) =>
        set(
          produce((state) => {
            state.speakerNums = nums
          })
        ),
      setSpeakerNames: (namesOrUpdater) =>
        set(
          produce((state) => {
            state.speakerNames =
              typeof namesOrUpdater === 'function'
                ? namesOrUpdater(state.speakerNames)
                : namesOrUpdater
          })
        ),
      setDialogueItems: (itemsOrUpdater) =>
        set(
          produce((state) => {
            state.dialogueItems =
              typeof itemsOrUpdater === 'function'
                ? itemsOrUpdater(state.dialogueItems)
                : itemsOrUpdater
          })
        ),
      setSpeakers: (speakersOrUpdater) =>
        set(
          produce((state) => {
            state.speakers =
              typeof speakersOrUpdater === 'function'
                ? speakersOrUpdater(state.speakers)
                : speakersOrUpdater
          })
        ),
      setResources: (resourcesOrUpdater) =>
        set(
          produce((state) => {
            state.resources =
              typeof resourcesOrUpdater === 'function'
                ? resourcesOrUpdater(state.resources)
                : resourcesOrUpdater
          })
        ),
      setLang: (lang) =>
        set(
          produce((state) => {
            state.lang = lang
          })
        ),
      setIsLongGenerating: (isLongGenerating) =>
        set(
          produce((state) => {
            state.isLongGenerating = isLongGenerating
          })
        ),
      updateAll: (fields) =>
        set(
          produce((state) => {
            for (const [key, value] of Object.entries(fields)) {
              state[key as keyof PodcastInfoStore] = value
            }
          })
        ),
      setHasHydrated: (value) =>
        set(
          produce((state) => {
            state._hasHydrated = value
          })
        ),
    }),
    'podcast_info_store'
  )
)
