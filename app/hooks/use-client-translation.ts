import { useParams } from 'next/navigation'
import { useTranslation } from '../i18n/client'

export function useClientTranslation() {
  const { locale } = useParams()
  const { t } = useTranslation(locale as string)

  return {
    t,
  }
}
