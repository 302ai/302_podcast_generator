'use client'
import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getAll, remove, Session } from '@/lib/db'
import { cn } from '@/lib/utils'
import { formatDate } from 'date-fns'
import ky from 'ky'
import { Download, History, Loader2, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Props {
  className?: string
}
function _History({ className }: Props) {
  const { t } = useClientTranslation()

  const [sessions, setSessions] = useState<Session[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchSessions = async () => {
      const sessions = await getAll()
      setSessions(sessions)
    }
    if (open) {
      fetchSessions()
    }
  }, [open])

  const deleteSession = async (id: string) => {
    try {
      await remove(id)
      console.log(id)
      setSessions(sessions.filter((session) => session.id !== id))
      toast.success(t('extras:history.delete.success'))
    } catch (error) {
      toast.error(t('extras:history.delete.error'))
    }
  }

  const [isDownloadings, setIsDownloadings] = useState<Record<string, boolean>>(
    {}
  )

  const downloadFile = async (url: string, title: string, id: string) => {
    setIsDownloadings((prev) => ({ ...prev, [id]: true }))
    try {
      const response = await ky.get(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${title}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(t('extras:history.download.success'))
    } catch (error) {
      toast.error(t('extras:history.download.error'))
    } finally {
      setIsDownloadings((prev) => ({ ...prev, [id]: false }))
    }
  }

  const downloadSession = async (id: string) => {
    const session = sessions.find((session) => session.id === id)
    if (!session) {
      toast.error(t('extras:history.download.error'))
      return
    }
    downloadFile(session.mp3, session.title, session.id)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild={true}>
          <Button
            aria-label={t('extras:history.trigger.label')}
            variant='icon'
            size='roundIconSm'
            className={cn(className)}
            onClick={() => setOpen(true)}
          >
            <History className='size-4' />
          </Button>
        </DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className='max-h-[500px] overflow-y-auto'
        >
          <DialogHeader>
            <DialogTitle>{t('extras:history.title')}</DialogTitle>
          </DialogHeader>
          {sessions.length === 0 ? (
            <div className='flex h-full items-center justify-center'>
              <p className='text-gray-500'>{t('extras:history.empty')}</p>
            </div>
          ) : (
            <div className='space-y-4 divide-y'>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className='flex items-center justify-between gap-2'
                >
                  <div className='flex flex-col justify-between'>
                    <h2 className='text-sm font-medium'>{session.title}</h2>
                    <p className='text-xs text-gray-500'>
                      {formatDate(session.createdAt, 'yy-MM-dd HH:mm:ss')}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='icon'
                      size='roundIconLg'
                      onClick={() => downloadSession(session.id)}
                      disabled={isDownloadings[session.id]}
                    >
                      {isDownloadings[session.id] ? (
                        <Loader2 className='size-4 animate-spin' />
                      ) : (
                        <Download className='size-4' />
                      )}
                    </Button>
                    <Button
                      variant='icon'
                      size='roundIconLg'
                      className='text-red-500 hover:text-red-500'
                      onClick={() => deleteSession(session.id)}
                    >
                      <Trash className='size-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { _History as History }
