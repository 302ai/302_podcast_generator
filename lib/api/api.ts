'use client'
import { useUserStore } from '@/app/stores/use-user-store'
import { emitter } from '@/lib/mitt'
import ky, { Options } from 'ky'
import { env } from 'next-runtime-env'
import { isEmpty } from 'radash'
import { langToCountry } from './lang-to-country'

const apiKy = ky.create({
  prefixUrl: env('NEXT_PUBLIC_API_URL'),
  timeout: false,
  hooks: {
    beforeRequest: [
      (request) => {
        const apiKey = env('NEXT_PUBLIC_API_KEY')
        if (apiKey) {
          request.headers.set('Authorization', `Bearer ${apiKey}`)
        }
        const lang = useUserStore.getState().language
        if (lang) {
          request.headers.set('Lang', langToCountry(lang))
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          const res = await response.json<{ error: { err_code: number } }>()
          if (!isEmpty(res.error?.err_code)) {
            emitter.emit('ToastError', res.error.err_code)
          }
        }
      },
    ],
  },
})


export class ApiError extends Error {
  error: { err_code: number }

  constructor(err_code: number) {
    super(err_code.toString())
    this.error = { err_code }
  }
}

const dialogueKy = ky.create({
  prefixUrl: env('NEXT_PUBLIC_DIALOGUE_API_URL'),
  timeout: false,
  hooks: {
    beforeRequest: [
      (request) => {
        const apiKey = env('NEXT_PUBLIC_API_KEY')
        if (apiKey) {
          request.headers.set('Authorization', `Bearer ${apiKey}`)
        }
        const lang = useUserStore.getState().language
        if (lang) {
          request.headers.set('Lang', langToCountry(lang))
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          const res = await response.json<{ error: { err_code: number } }>()
          if (!isEmpty(res.error?.err_code)) {
            emitter.emit('ToastError', res.error.err_code)
          }
        }
      },
    ],
  },
})



const fetcher = <T>(url: string, options: Options = {}): Promise<T> =>
  apiKy.post(url, options).json<T>()

export { apiKy, dialogueKy, fetcher }
