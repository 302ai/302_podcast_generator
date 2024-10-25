'use client'
import { logger } from '@/lib/logger'
import { emitter } from '@/lib/mitt'
import { useMemoizedFn } from 'ahooks'
import { env } from 'next-runtime-env'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import toast, { ErrorIcon } from 'react-hot-toast'
import { Trans } from 'react-i18next'
import { useClientTranslation } from '../hooks/use-client-translation'

export function ErrorHandler() {
  const { t } = useClientTranslation()
  const router = useRouter()

  const region = env('NEXT_PUBLIC_DEFAULT_REGION')

  const errorResolve = useMemoizedFn((code: number) => {
    if (code) {
      logger.error(`error: ${code}`)
      toast(
        () => (
          <div className='flex items-center gap-2'>
            <div>
              <ErrorIcon />
            </div>
            <div>
              <Trans
                t={t}
                i18nKey={[`errors.${code}`, `errors.default`]}
                components={{
                  ReLogin: (
                    <Link
                      href='auth'
                      className='underline'
                      style={{ color: '#0070f0' }}
                    ></Link>
                  ),
                  Gw: (
                    <Link
                      href={
                        region == '0'
                          ? env('NEXT_PUBLIC_OFFICIAL_WEBSITE_URL_CHINA')!
                          : env('NEXT_PUBLIC_OFFICIAL_WEBSITE_URL_GLOBAL')!
                      }
                      className='underline'
                      style={{ color: '#0070f0' }}
                      rel='noreferrer'
                    ></Link>
                  ),
                }}
              />
            </div>
          </div>
        ),
        {
          id: code.toString(),
        }
      )
      if (code === -10005) {
        router.push('auth', { scroll: false })
      }
    }
  })

  useEffect(() => {
    emitter.off('ToastError')
    emitter.on('ToastError', errorResolve)
  }, [errorResolve])

  return null
}
