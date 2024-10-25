export const fallbackLng = 'en'
export const languages = [fallbackLng, 'zh', 'ja']
export const cookieName = 'lang'
export const defaultNS = 'translation'
export const searchParamName = 'lang'

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS
) {
  return {
    // debug: true,
    supportedLngs: languages,
    // preload: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  }
}
