'use client'

import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { locale } = useParams()
  const { t } = useTranslation(locale as string)

  useEffect(() => {
    logger.error(error)
  }, [error])

  return (
    <div>
      <h2>{t('extras:error_page.title')}</h2>
      <Button variant='link' onClick={() => reset()}>
        {t('extras:error_page.reload')}
      </Button>
    </div>
  )
}
