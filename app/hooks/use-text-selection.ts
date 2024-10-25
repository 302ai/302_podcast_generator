import { useCallback, useEffect, useRef, useState } from 'react'

export interface SelectionPosition {
  x: number
  y: number
  width: number
  height: number
}

export function useTextSelection(
  textareaRef: React.RefObject<HTMLTextAreaElement>
) {
  const [selectedText, setSelectedText] = useState<string>('')
  const [selection, setSelection] = useState<{ start: number; end: number }>()
  const [selectionPosition, setSelectionPosition] =
    useState<SelectionPosition | null>(null)
  const mirrorDivRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!mirrorDivRef.current) {
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.visibility = 'hidden'
      div.style.whiteSpace = 'pre-wrap'
      div.style.wordWrap = 'break-word'
      div.style.pointerEvents = 'none'
      div.style.fontSize = '16px'
      div.style.fontFamily = 'Arial, sans-serif'
      div.style.fontWeight = 'normal'
      div.style.fontStyle = 'normal'
      div.style.lineHeight = '1.5'
      div.style.padding = '8px'
      div.style.border = '1px solid transparent'
      div.style.boxSizing = 'border-box'
      document.body.appendChild(div)
      mirrorDivRef.current = div
    }
  }, [])

  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current
    const mirrorDiv = mirrorDivRef.current
    if (!textarea || !mirrorDiv) return

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    setSelection({ start: selectionStart, end: selectionEnd })
    const selectedContent = textarea.value.substring(
      selectionStart,
      selectionEnd
    )
    setSelectedText(selectedContent)

    mirrorDiv.style.top =
      textarea.getBoundingClientRect().top + window.scrollY + 'px'
    mirrorDiv.style.left =
      textarea.getBoundingClientRect().left + window.scrollX + 'px'

    const computedStyle = window.getComputedStyle(textarea)
    const properties = [
      'font-size',
      'font-family',
      'font-weight',
      'font-style',
      'line-height',
      'padding',
      'border',
      'white-space',
      'word-wrap',
      'box-sizing',
      'width',
      'height',
    ]
    properties.forEach((prop) => {
      mirrorDiv.style[prop as any] = computedStyle.getPropertyValue(prop)
    })

    mirrorDiv.style.width = computedStyle.width
    mirrorDiv.style.height = computedStyle.height

    mirrorDiv.innerHTML = ''

    const beforeText = textarea.value.substring(0, selectionStart)
    const afterText = textarea.value.substring(selectionEnd)

    const beforeSpan = document.createElement('span')
    beforeSpan.textContent = beforeText.replace(/\s/g, '\u00a0')
    mirrorDiv.appendChild(beforeSpan)

    const span = document.createElement('span')
    span.textContent = selectedContent || '\u200b'
    mirrorDiv.appendChild(span)

    const afterSpan = document.createElement('span')
    afterSpan.textContent = afterText.replace(/\s/g, '\u00a0')
    mirrorDiv.appendChild(afterSpan)

    const spanRect = span.getBoundingClientRect()
    setSelectionPosition({
      x: spanRect.left + window.scrollX,
      y: spanRect.top + window.scrollY,
      width: spanRect.width,
      height: spanRect.height,
    })
  }, [textareaRef])

  return { selectedText, selection, selectionPosition, handleSelect }
}
