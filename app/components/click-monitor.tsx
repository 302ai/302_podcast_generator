'use client'

import { useMonitorMessage } from '@/app/hooks/use-monitor-message'
import { useCallback, useEffect } from 'react'

const FILE_EXTENSIONS = [
  '3gp', '7z', 'ai', 'apk', 'avi', 'bmp', 'csv', 'dmg', 'doc', 'docx',
  'fla', 'flv', 'gif', 'gz', 'gzip', 'ico', 'iso', 'indd', 'jar', 'jpeg',
  'jpg', 'm3u8', 'mov', 'mp3', 'mp4', 'mpa', 'mpg', 'mpeg', 'msi', 'odt',
  'ogg', 'ogv', 'pdf', 'png', 'ppt', 'pptx', 'psd', 'rar', 'raw',
  'svg', 'swf', 'tar', 'tif', 'tiff', 'ts', 'txt', 'wav', 'webm', 'webp',
  'wma', 'wmv', 'xls', 'xlsx', 'xml', 'zip', 'json', 'yaml', '7zip', 'mkv',
]


export const ClickMonitor = () => {
  const isDownloadLink = useCallback((url: string) => {
    const pattern = new RegExp(`\\.(${FILE_EXTENSIONS.join('|')})$`, 'i')
    return pattern.test(url)
  }, [])

  const isSpecialDownload = useCallback((url: string) =>
    ['blob:', 'data:'].some(protocol => url.startsWith(protocol)), [])

  const findClosestAnchor = useCallback((element: HTMLElement | null): HTMLAnchorElement | null => {
    let current = element
    for (let i = 0; i < 5 && current; i++) {
      if (current.tagName === 'A') return current as HTMLAnchorElement
      current = current.parentElement
    }
    return null
  }, [])

  const { sendMonitorMessage } = useMonitorMessage()

  const handleClick = useCallback((event: MouseEvent) => {
    const anchor = findClosestAnchor(event.target as HTMLElement)
    if (!anchor) return

    const url = anchor.href
    const target = anchor.target
    const download = anchor.download

    const eventType = (isDownloadLink(url) || isSpecialDownload(url) || anchor.hasAttribute('download'))
      ? 'downloadFile'
      : 'openNewWindow'

    if (target === '_blank' || eventType === 'downloadFile') {
      sendMonitorMessage({
        eventType,
        target,
        url,
        download,
      })
    }
  }, [isDownloadLink, isSpecialDownload, findClosestAnchor, sendMonitorMessage])

  useEffect(() => {
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [handleClick])

  return null
}
