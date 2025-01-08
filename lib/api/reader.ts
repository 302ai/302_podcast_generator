'use client'

import { apiKy } from './api'
import { env } from 'next-runtime-env'

interface JinaErrorResponse {
  data: null
  code: number
  message: string
  status: number
  name: string
  readableMessage: string
}

export interface ReaderOptions {
  url: string
}

export class WebsiteReader {
  async readToMarkdown(url: string): Promise<string> {
    const apiKey = env('NEXT_PUBLIC_API_KEY')
    if (!apiKey) {
      throw new Error('API key is required for website reader')
    }

    if (!url) {
      throw new Error('URL is required')
    }

    try {
      const encodedUrl = encodeURIComponent(url)
      const response = await apiKy.get(`jina/reader/${encodedUrl}`, {
        headers: {
          Accept: 'text/plain',
        }
      })

      const contentType = response.headers.get('content-type')


      if (contentType?.includes('text/plain')) {
        const content = await response.text()
        if (!content) {
          throw new Error('No content returned from website')
        }
        return content
      }

      const data = await response.json() as JinaErrorResponse
      if (data.code === 422 || !response.ok) {
        console.log('Falling back to proxy content fetch')
        const proxyResponse = await fetch(`/api/preview?url=${encodedUrl}`)
        if (!proxyResponse.ok) {
          throw new Error(`Proxy fetch failed: ${proxyResponse.statusText}`)
        }
        return await proxyResponse.text()
      }

      throw new Error('Unexpected response format')
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read website: ${error.message}`)
      }
      throw new Error('Failed to read website')
    }
  }
}

export function createWebsiteReader(): WebsiteReader {
  return new WebsiteReader()
}
