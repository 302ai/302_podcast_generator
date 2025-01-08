'use client'

import { optimizeContent } from '@/app/actions/chat'
import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { useUserStore } from '@/app/stores/use-user-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { emitter } from '@/lib/mitt'
import { Selection } from '@tiptap/pm/state'
import { BubbleMenu, Editor, EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { readStreamableValue } from 'ai/rsc'
import { Copy, Loader2, Replace, RotateCcw, Send, X } from 'lucide-react'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import { useCopyToClipboard } from 'usehooks-ts'
import LogoIcon from '../icons/logo-icon'
import SelectionHighlight from './selectionHighlight'
import { env } from 'next-runtime-env'
const Tiptap = forwardRef<
  Editor | null,
  {
    content: string
    editable?: boolean
    onContentChange: (content: string) => void
    setEditor?: (editor: Editor | null) => void
  }
>(({ content, editable = true, onContentChange, setEditor }, ref) => {
  const { t } = useClientTranslation()
  const [hasSelection, setHasSelection] = useState(false)
  const editor = useEditor({
    extensions: [StarterKit, SelectionHighlight],
    content: content,
    editorProps: {
      attributes: {
        class:
          'w-full min-h-9 p-2 prose dark:prose-invert prose-sm max-w-full focus:outline-none rounded-md',
      },
      handleKeyDown: (view, event) => {
        if (hasSelection) {
          const { from, to } = view.state.selection
          const tr = view.state.tr.removeMark(
            from,
            to,
            view.state.schema.marks[SelectionHighlight.name]
          )
          view.dispatch(tr)
          previousSelection.current = null
          selectedText.current = null
        }
      },
      handleDOMEvents: {},
    },
    immediatelyRender: false,
    editable: editable,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML())
    },
  })

  useImperativeHandle(ref, () => editor!, [editor])
  useEffect(() => {
    setEditor?.(editor)
  }, [editor, setEditor])

  const previousSelection = useRef<Selection | null>(null)
  const selectedText = useRef<string | null>(null)
  useEffect(() => {
    if (!editor) return
    const { commands, state } = editor
    if (hasSelection) {
      previousSelection.current = editor.state.selection
      const { from, to } = state.selection
      selectedText.current = state.doc.textBetween(from, to, '\n')

      commands.setTextSelection(previousSelection.current)
      commands.setSelectionHighlight()
    } else {
      if (previousSelection.current) {
        const { state, view } = editor
        const { from, to } = previousSelection.current
        try {
          const tr = state.tr.removeMark(
            from,
            to,
            state.schema.marks[SelectionHighlight.name]
          )
          view.dispatch(tr)
          previousSelection.current = null
          selectedText.current = null
        } catch {
        }
      }
    }
  }, [hasSelection, editor])

  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')

  const handleSend = useCallback(async () => {
    if (!prompt) {
      toast.error(t('home:tiptap.empty_input_warning'))
      return
    }
    setIsLoading(true)
    setGeneratedContent('')
    try {
      const { output } = await optimizeContent({
        model: env('NEXT_PUBLIC_DEFAULT_MODEL_NAME') || 'gpt-4o-mini',
        apiKey: env('NEXT_PUBLIC_API_KEY') || '',
        content: content || '',
        reference: selectedText.current || '',
        prompt: prompt,
      })

      for await (const delta of readStreamableValue(output)) {
        setGeneratedContent(
          (generatedContent) => generatedContent + (delta ?? '')
        )
      }
    } catch (error) {
      console.error(error)
      const errCode = JSON.parse(error as string).error.err_code
      emitter.emit('ToastError', errCode)
    } finally {
      setIsLoading(false)
    }
  }, [prompt, content])

  const [copiedText, copy] = useCopyToClipboard()
  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        toast.success(t('extras:copySuccess'))
      })
      .catch((error: any) => {
        toast.error(t('extras:copyFailed'))
      })
  }

  const [replacedContentPosition, setReplacedContentPosition] = useState<{
    from: number
    to: number
  } | null>(null)

  const handleReplace = () => {
    if (!editor || !previousSelection.current) return
    const { state, view, commands } = editor
    const { from, to } = previousSelection.current

    let tr = state.tr.replaceRangeWith(
      from,
      to,
      state.schema.text(generatedContent)
    )

    view.dispatch(tr)

    setReplacedContentPosition({ from, to: from + generatedContent.length })
    setGeneratedContent('')

    // const newTr = state.tr.setSelection(
    //   TextSelection.create(
    //     previousSelection.current.$anchor.doc,
    //     from,
    //     from + generatedContent.length
    //   )
    // )
    // view.dispatch(newTr)
  }

  const handleCancel = () => {
    setIsLoading(false)
    setGeneratedContent('')
  }

  return (
    <>
      <BubbleMenu
        editor={editor}
        tippyOptions={{
          duration: 100,
          placement: 'bottom',
          onHide: () => {
            setHasSelection(false)
          },
          onShow: () => setHasSelection(true),
          onClickOutside: (instance) => {
            setHasSelection(false)
            instance.hide()
          },
          zIndex: 9999,
          appendTo: document.body,
        }}
        className="relative z-[9999]"
      >
        <div className='flex w-64 flex-col gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-lg border shadow-lg'>
          <div className='flex flex-col gap-2 p-2'>
            <div className='relative'>
              <div className='absolute left-2 top-1/2 -translate-y-1/2'>
                <LogoIcon className='size-6' />
              </div>
              <Input
                placeholder={t('home:tiptap.input_placeholder')}
                className='h-12 border-primary bg-background pl-10 pr-10 shadow-sm shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-100'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleSend()
                  }
                }}
                disabled={isLoading}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='group absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center bg-transparent p-0'
                    onClick={handleSend}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Send className='size-4 text-primary group-hover:text-primary/80' />
                    )}
                  </button>
                </TooltipTrigger>
                {!prompt && <TooltipContent>{t('home:tiptap.empty_input_warning')}</TooltipContent>}
              </Tooltip>
            </div>
            <div>
              <div className='text-xs text-muted-foreground mb-1'>{t('home:tiptap.preset_prompts')}</div>
              <div className='grid grid-cols-2 gap-1'>
                {['concise', 'formal', 'casual', 'grammar', 'typo'].map((type) => (
                  <button
                    key={type}
                    className='text-xs px-2 py-1 rounded border hover:bg-accent text-left'
                    onClick={() => setPrompt(t(`home:tiptap.preset_${type}`))}
                  >
                    {t(`home:tiptap.preset_${type}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {generatedContent.length > 0 && (
            <div className='flex flex-col gap-2 rounded-md border border-primary bg-background p-2 text-sm text-primary'>
              <div>{generatedContent}</div>
              <div className='flex gap-2'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='outline' size='sm' onClick={handleReplace}>
                      <Replace className='size-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('home:tiptap.button_replace')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCopy(generatedContent)}
                    >
                      <Copy className='size-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('home:tiptap.button_copy')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='outline' size='sm' onClick={handleCancel}>
                      <X className='size-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('home:tiptap.button_cancel')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='outline' size='sm' onClick={handleSend}>
                      <RotateCcw className='size-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('home:tiptap.button_regenerate')}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </BubbleMenu>
      <EditorContent
        className='min-h-9 selection:bg-blue-300 dark:selection:bg-primary'
        editor={editor}
      />
    </>
  )
})
Tiptap.displayName = 'Tiptap'
export default Tiptap
