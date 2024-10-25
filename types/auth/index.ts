import { useTranslation } from '@/app/i18n/client'

export type UseTranslationReturnType = Awaited<
  ReturnType<typeof useTranslation>['t']
>
