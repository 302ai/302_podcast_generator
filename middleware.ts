import {
  cookieName,
  fallbackLng,
  languages,
  searchParamName,
} from '@/app/i18n/settings'
import acceptLanguage from 'accept-language'
import { NextRequest, NextResponse } from 'next/server'

acceptLanguage.languages(languages)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next|_next/image|assets|favicon.ico|icon|chrome|sw.js|site.webmanifest|.*.(?:png|jpg|jpeg)).*)',
  ],
}

export function middleware(req: NextRequest) {
  let lng: string | undefined | null
  let searchLng: string | undefined | null = undefined
  let pathLng: string | undefined | null = undefined
  // 1 Get language from query params
  if (req.nextUrl.searchParams.has(searchParamName))
    searchLng = acceptLanguage.get(
      req.nextUrl.searchParams.get(searchParamName)
    )
  // 2 Get language from cookies
  if (req.cookies.has(cookieName))
    lng = acceptLanguage.get(req.cookies.get(cookieName)?.value)
  // 3 Get language from headers
  if (!lng) lng = acceptLanguage.get(req.headers.get('Accept-Language'))
  // 4 Default language
  if (!lng) lng = fallbackLng

  // Remove search param if it exists
  if (searchLng) {
    req.nextUrl.searchParams.delete(searchParamName)
  }

  // Get language from path
  pathLng = languages.find((loc) => req.nextUrl.pathname.startsWith(`/${loc}`))

  // Redirect to path prefixed with language if query param exists
  // Or if it doesn't exist and path is not prefixed with language
  if (
    // 1 No path prefixed with query param
    (searchLng && !req.nextUrl.pathname.startsWith(`/${searchLng}`)) ||
    // 2 No path prefixed with language
    !pathLng
  ) {
    if (searchLng) {
      lng = searchLng
      req.nextUrl.pathname =
        req.nextUrl.pathname.replace(`/${pathLng}`, '') || '/'
    }
    const url = req.nextUrl.clone()
    url.pathname = `/${lng}${url.pathname}`
    return NextResponse.redirect(url, {
      headers: {
        'Set-Cookie': `${cookieName}=${lng}; path=/; Max-Age=2147483647`,
      },
    })
  }

  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer') || '')
    const lngInReferer = languages.find((l) =>
      refererUrl.pathname.startsWith(`/${l}`)
    )
    const response = NextResponse.next()
    if (lngInReferer) response.cookies.set(cookieName, lngInReferer)
    return response
  }

  return NextResponse.next()
}
