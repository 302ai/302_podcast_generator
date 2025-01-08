'use client'

import { apiKy } from './api'
import { env } from 'next-runtime-env'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  siteName?: string
  datePublished?: string
  meta?: {
    provider: SearchProvider
    keywords?: string[]
    searchDescription?: string
  }
}

export type SearchProvider = 'tavily' | 'bochaai' | 'google' | 'bing' | 'baidu' | 'duckduckgo'

export interface SearchOptions {
  query: string
  language?: string
  count?: number
  page?: number // Page number for pagination
  timePeriod?: 'day' | 'week' | 'month' | 'year' | 'noLimit'
  provider?: SearchProvider // Optional provider selection
}

export interface ISearchProvider {
  search(options: SearchOptions): Promise<SearchResult[]>
  supportsPagination?(): boolean
  getMaxResultsPerPage?(): number
}

// Additional interface for providers that expose pagination info
export interface IPaginationInfo {
  supportsPagination(provider?: SearchProvider): boolean
  getMaxResultsPerPage(provider?: SearchProvider): number
}

interface TavilyResponse {
  results: Array<{
    title: string
    url: string
    content: string
    published_date?: string
  }>
}

interface BochaaResponse {
  data: {
    webPages: {
      value: Array<{
        name: string
        url: string
        snippet: string
        siteName?: string
        dateLastCrawled?: string
      }>
    }
  }
}

interface SearchApiResponse {
  organic_results: Array<{
    title: string
    link: string
    snippet: string
    domain?: string
    date?: string
  }>
}

export class TavilySearchProvider implements ISearchProvider {
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const apiKey = env('NEXT_PUBLIC_API_KEY')
    if (!apiKey) {
      throw new Error('API key is required for Tavily search')
    }

    // Tavily expects api_key in request body
    const formData = new FormData()
    formData.append('query', options.query)
    formData.append('search_depth', 'basic')
    formData.append('max_results', (options.count || 10).toString())
    formData.append('api_key', apiKey)

    const data = await apiKy.post('tavily/search', {
      body: formData,
      headers: {
        Authorization: ''
      }
    }).json<TavilyResponse>()

    return data.results.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      siteName: new URL(result.url).hostname,
      datePublished: result.published_date,
      meta: {
        provider: 'tavily'
      }
    }))
  }

  supportsPagination() {
    return false
  }

  getMaxResultsPerPage() {
    return 10
  }
}

export class BochaaSearchProvider implements ISearchProvider {
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const data = await apiKy.post('bochaai/v1/web-search', {
      json: {
        query: options.query,
        freshness: options.timePeriod || 'noLimit',
        count: options.count || 10,
      }
    }).json<BochaaResponse>()

    return data.data.webPages.value.map((result) => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet,
      siteName: result.siteName,
      datePublished: result.dateLastCrawled,
      meta: {
        provider: 'bochaai'
      }
    }))
  }

  supportsPagination() {
    return false
  }

  getMaxResultsPerPage() {
    return 10
  }
}

abstract class SearchApiProviderBase implements ISearchProvider {
  protected abstract engine: string
  protected abstract maxResults: number

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const apiKey = env('NEXT_PUBLIC_API_KEY')
    if (!apiKey) {
      throw new Error(`API key is required for ${this.engine} search`)
    }

    const searchParams: Record<string, string> = {
      api_key: apiKey,
      q: options.query,
      engine: this.engine,
    }

    // Add pagination parameters if supported
    if (this.supportsPagination()) {
      searchParams.num = Math.min(options.count || 10, this.maxResults).toString()
      if (options.page) {
        searchParams.page = options.page.toString()
      }
    }

    // Add language/region parameters if supported
    if (this.supportsLanguage() && options.language) {
      searchParams.gl = this.mapLanguageToCountry(options.language)
    }

    const data = await apiKy.get('searchapi/search', {
      searchParams,
      headers: {
        Authorization: ''
      }
    }).json<SearchApiResponse>()

    return data.organic_results.map((result) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      siteName: result.domain,
      datePublished: result.date,
      meta: {
        provider: this.engine as SearchProvider
      }
    }))
  }

  supportsPagination(): boolean {
    return ['google', 'bing', 'baidu'].includes(this.engine)
  }

  getMaxResultsPerPage(): number {
    return this.maxResults
  }

  protected supportsLanguage(): boolean {
    return ['google', 'bing', 'baidu'].includes(this.engine)
  }

  protected mapLanguageToCountry(language: string): string {
    const languageMap: Record<string, string> = {
      en: 'us',
      zh: 'cn',
      ja: 'jp',
    }
    return languageMap[language] || 'us'
  }
}

export class GoogleSearchProvider extends SearchApiProviderBase {
  protected engine = 'google'
  protected maxResults = 50

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const searchParams = {
      google_domain: 'google.com',
      ...options,
    }
    return super.search(searchParams)
  }
}

export class BingSearchProvider extends SearchApiProviderBase {
  protected engine = 'bing'
  protected maxResults = 50
}

export class BaiduSearchProvider extends SearchApiProviderBase {
  protected engine = 'baidu'
  protected maxResults = 50
}

export class DuckDuckGoSearchProvider extends SearchApiProviderBase {
  protected engine = 'duckduckgo'
  protected maxResults = 50 // Subsequent pages return 50 results

  supportsPagination(): boolean {
    return true // Only supports page parameter
  }

  getMaxResultsPerPage(): number {
    return this.maxResults
  }

  protected supportsLanguage(): boolean {
    return false // DuckDuckGo doesn't support language/region parameters
  }
}

export class UnifiedSearchProvider implements ISearchProvider, IPaginationInfo {
  private providerMap: Record<SearchProvider, ISearchProvider>

  constructor() {
    this.providerMap = {
      tavily: new TavilySearchProvider(),
      bochaai: new BochaaSearchProvider(),
      google: new GoogleSearchProvider(),
      bing: new BingSearchProvider(),
      baidu: new BaiduSearchProvider(),
      duckduckgo: new DuckDuckGoSearchProvider(),
    }
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    // If provider is specified, use only that provider
    if (options.provider) {
      const provider = this.providerMap[options.provider]
      if (!provider) {
        throw new Error(`Provider ${options.provider} not found`)
      }
      return await provider.search(options)
    }

    // If no provider specified, try each provider in sequence until one succeeds
    for (const provider of Object.values(this.providerMap)) {
      try {
        return await provider.search(options)
      } catch (error) {
        console.error('Search provider failed:', error)
        // Continue to next provider
      }
    }
    throw new Error('All search providers failed')
  }

  // Get available providers
  getAvailableProviders(): SearchProvider[] {
    return Object.keys(this.providerMap) as SearchProvider[]
  }

  // Check if provider supports pagination
  supportsPagination(provider?: SearchProvider): boolean {
    if (provider) {
      return this.providerMap[provider]?.supportsPagination?.() || false
    }
    return false
  }

  // Get max results per page for provider
  getMaxResultsPerPage(provider?: SearchProvider): number {
    if (provider) {
      return this.providerMap[provider]?.getMaxResultsPerPage?.() || 10
    }
    return 10
  }
}

// Factory function to create a unified search provider
export function createUnifiedSearchProvider(): UnifiedSearchProvider {
  return new UnifiedSearchProvider()
}
