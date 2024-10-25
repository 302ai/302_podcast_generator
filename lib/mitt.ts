'use client'
import mitt from 'mitt'
export type ProgressEvent = {
  progress: number
  description: string
  content: string
  title: string
}

type Events = {
  ToastError: number
  ProgressEvent: ProgressEvent
}
const emitter = mitt<Events>()

export { emitter }
