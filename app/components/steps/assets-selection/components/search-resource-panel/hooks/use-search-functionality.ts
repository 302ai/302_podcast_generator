import { generateSearchKeywords } from '@/app/actions/chat'
import { SearchProvider } from '@/lib/api/search'
import { useCallback } from 'react'

export function useSearchFunctionality({
  searchDescription,
  searchKeywords,
  setSearchKeywords,
  selectedProviders,
  setSearchResults,
  searchProvider,
  apiKey,
  t,
  setIsGeneratingKeywords,
  setIsSearching
}: {
  searchDescription: string
  searchKeywords: string[]
  setSearchKeywords: (keywords: string[]) => void
  selectedProviders: SearchProvider[]
  setSearchResults: (results: any[]) => void
  searchProvider: any
  apiKey: string
  t: (key: string) => string
  setIsGeneratingKeywords: (isGenerating: boolean) => void
  setIsSearching: (isSearching: boolean) => void
}) {
  const generateKeywords = useCallback(async () => {
    if (!searchDescription || !apiKey) return

    setIsGeneratingKeywords(true)
    try {
      const result = await generateSearchKeywords({
        model: 'gpt-4o',
        apiKey,
        userInput: searchDescription
      })

      const allKeywords = [
        ...result.mainKeywords,
        ...result.relatedPhrases,
        ...result.technicalTerms,
        ...result.alternativeTerms
      ]
      setSearchKeywords(allKeywords)
    } catch (error) {
      console.error(t('home:step.asset-type.failed_to_generate'), error)
    } finally {
      setIsGeneratingKeywords(false)
    }
  }, [searchDescription, apiKey, setSearchKeywords, t, setIsGeneratingKeywords])

  const handleSearch = useCallback(async () => {
    if (!selectedProviders.length) return
    if (!searchDescription && !searchKeywords.length) return

    setIsSearching(true)
    try {

      const query = searchKeywords.length > 0 ? searchKeywords.join(' ') : searchDescription
      const searchPromises = selectedProviders.map(provider =>
        searchProvider.search({
          query,
          provider,
          count: 10
        })
      )

      const allResults = await Promise.all(searchPromises)

      const mergedResults = allResults.flat()

      const uniqueResults = Array.from(
        new Map(mergedResults.map(result => [result.url, result])).values()
      )

      setSearchResults(uniqueResults)
    } catch (error) {
      console.error(t('home:step.asset-type.search_failed'), error)
    } finally {
      setIsSearching(false)
    }
  }, [searchDescription, searchKeywords, selectedProviders, searchProvider, setSearchResults, t, setIsSearching])

  return {
    generateKeywords,
    handleSearch
  }
}
