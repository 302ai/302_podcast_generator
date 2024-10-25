import { env } from 'next-runtime-env'

export function use302Url() {
  const region = env('NEXT_PUBLIC_DEFAULT_REGION')

  return {
    href:
      region == '0'
        ? env('NEXT_PUBLIC_OFFICIAL_WEBSITE_URL_CHINA')!
        : env('NEXT_PUBLIC_OFFICIAL_WEBSITE_URL_GLOBAL')!,
  }
}
