interface SEO {
  title: string
  description: string
  image: string
}

interface SEOResponseData {
  id: string
  supportLanguages: string[]
  fallbackLanguage: string
  languages: {
    [key: string]: SEO
  }
}
