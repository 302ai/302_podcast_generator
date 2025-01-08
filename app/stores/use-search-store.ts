import { SearchProvider, SearchResult } from '@/lib/api/search'
import { produce } from 'immer'
import { create } from 'zustand'
import { storeMiddleware } from './middleware'

interface SearchState {
  _hasHydrated: boolean
  searchDescription: string
  searchKeywords: string[]
  selectedProviders: SearchProvider[]
  searchResults: SearchResult[]
  selectedUrls: string[]
  selectedPreview: string | null
  isGeneratingKeywords: boolean
  isSearching: boolean
}

interface SearchActions {
  setSearchDescription: (description: string) => void
  setSearchKeywords: (keywords: string[]) => void
  setSelectedProviders: (providers: SearchProvider[]) => void
  setSearchResults: (results: SearchResult[]) => void
  setSelectedUrls: (urls: string[]) => void
  setSelectedPreview: (url: string | null) => void
  setIsGeneratingKeywords: (isGenerating: boolean) => void
  setIsSearching: (isSearching: boolean) => void

  toggleResultSelection: (url: string) => void
  toggleSelectAll: () => void
  deleteUnselectedResults: () => void
  resetSearch: () => void
  toggleProvider: (provider: SearchProvider) => void

  setHasHydrated: (value: boolean) => void
  updateField: <T extends keyof SearchState>(field: T, value: SearchState[T]) => void
  updateAll: (fields: Partial<SearchState>) => void
  reset: () => void
}

const initialState: Omit<SearchState, '_hasHydrated'> = {
  searchDescription: '',
  searchKeywords: [],
  selectedProviders: ['google'],
  searchResults: [],
  selectedUrls: [],
  selectedPreview: null,
  isGeneratingKeywords: false,
  isSearching: false,
}

export const useSearchStore = create<SearchState & SearchActions>()(
  storeMiddleware<SearchState & SearchActions>(
    (set, get) => ({
      _hasHydrated: false,
      ...initialState,

      setSearchDescription: (description) =>
        set(
          produce((state) => {
            state.searchDescription = description
          })
        ),

      setSearchKeywords: (keywords) =>
        set(
          produce((state) => {
            state.searchKeywords = keywords
          })
        ),

      setSelectedProviders: (providers) =>
        set(
          produce((state) => {
            state.selectedProviders = providers
          })
        ),

      setSearchResults: (results) =>
        set(
          produce((state) => {
            state.searchResults = results
          })
        ),

      setSelectedUrls: (urls) =>
        set(
          produce((state) => {
            state.selectedUrls = urls
          })
        ),

      setSelectedPreview: (url) =>
        set(
          produce((state) => {
            state.selectedPreview = url
          })
        ),

      setIsGeneratingKeywords: (isGenerating) =>
        set(
          produce((state) => {
            state.isGeneratingKeywords = isGenerating
          })
        ),

      setIsSearching: (isSearching) =>
        set(
          produce((state) => {
            state.isSearching = isSearching
          })
        ),

      toggleResultSelection: (url: string) =>
        set(
          produce((state) => {
            const isSelected = state.selectedUrls.includes(url)
            state.selectedUrls = isSelected
              ? state.selectedUrls.filter((selectedUrl: string) => selectedUrl !== url)
              : [...state.selectedUrls, url]
          })
        ),

      toggleSelectAll: () =>
        set(
          produce((state) => {
            const currentSearchUrls = state.searchResults.map((r: SearchResult) => r.url)
            const allSelected = currentSearchUrls.every((url: string) =>
              state.selectedUrls.includes(url)
            )

            if (allSelected) {
              state.selectedUrls = state.selectedUrls.filter(
                (url: string) => !currentSearchUrls.includes(url)
              )
            } else {
              state.selectedUrls = Array.from(
                new Set([...state.selectedUrls, ...currentSearchUrls])
              )
            }
          })
        ),

      deleteUnselectedResults: () =>
        set(
          produce((state) => {
            const selectedSet = new Set(state.selectedUrls);
            state.searchResults = state.searchResults.filter((result: SearchResult) =>
              selectedSet.has(result.url)
            );
            state.selectedUrls = state.searchResults.map((result: SearchResult) => result.url);
          })
        ),

      resetSearch: () =>
        set(
          produce((state) => {
            state.searchDescription = '';
            state.searchKeywords = [];
            state.searchResults = [];
            state.selectedUrls = [];
            state.selectedPreview = null;
            state.isGeneratingKeywords = false;
            state.isSearching = false;
          })
        ),

      toggleProvider: (provider: SearchProvider) =>
        set(
          produce((state) => {
            const isSelected = state.selectedProviders.includes(provider)
            state.selectedProviders = isSelected
              ? state.selectedProviders.filter((p: SearchProvider) => p !== provider)
              : [...state.selectedProviders, provider]
          })
        ),

      setHasHydrated: (value) =>
        set(
          produce((state) => {
            state._hasHydrated = value
          })
        ),

      updateField: (field, value) =>
        set(
          produce((state) => {
            state[field] = value
          })
        ),

      updateAll: (fields) =>
        set(
          produce((state) => {
            Object.assign(state, fields)
          })
        ),

      reset: () => set(initialState),
    }),
    'search_store'
  )
)
