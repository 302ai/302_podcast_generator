export function detectUrls(text: string): string[] {
  const urlPattern =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi
  const matches = text.match(urlPattern)
  return matches ? Array.from(new Set(matches)) : []
}

export function detectUrl(text: string): string | null {
  const urls = detectUrls(text)
  return urls.length > 0 ? urls[0] : null
}

export function isValidUrl(url: string): boolean {
  const urlPattern =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi
  return urlPattern.test(url)
}

export function extractDomain(url: string): string | null {
  try {
    const { hostname } = new URL(url)
    return hostname
  } catch (e) {
    return null
  }
}
