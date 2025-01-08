import { useCallback } from "react"

interface MonitorMessage {
  from: 'monitor'
  eventType: 'downloadFile' | 'openNewWindow'
  target?: string
  url: string
  download?: string
}

export const useMonitorMessage = () => {
  const sendMonitorMessage = useCallback((message: Omit<MonitorMessage, 'from'>) => {
    console.log('sendMonitorMessage', message)
    window.parent.postMessage({
      from: 'monitor',
      ...message,
    }, '*')
  }, [])

  const handleDownload = useCallback((url: string, filename?: string) => {
    sendMonitorMessage({
      eventType: 'downloadFile',
      url,
      download: filename,
    })
  }, [sendMonitorMessage])

  const handleNewWindow = useCallback((url: string, target: string = '_blank') => {
    sendMonitorMessage({
      eventType: 'openNewWindow',
      url,
      target,
    })
  }, [sendMonitorMessage])

  return {
    handleDownload,
    handleNewWindow,
    sendMonitorMessage,
  }
}
