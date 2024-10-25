import { env } from 'next-runtime-env'
import { useParams, usePathname } from 'next/navigation'
import { useMemo } from 'react'

const sharePath = env('NEXT_PUBLIC_SHARE_PATH')!

function useIsSharePath() {
  const { locale } = useParams()
  const pathname = usePathname()

  const isSharePath = useMemo(
    () => pathname.startsWith(`/${locale}${sharePath}`),
    [pathname, locale]
  )

  return { isSharePath }
}

export { useIsSharePath }
