const map = {
  zh: 'cn',
  en: 'en',
  ja: 'jp',
}

export function langToCountry(lang: string) {
  return map[lang as keyof typeof map] || lang
}
