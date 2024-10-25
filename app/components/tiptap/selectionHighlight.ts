import { Mark } from '@tiptap/react'

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    selectionHighlight: {
      /**
       * Set a selection highlight mark
       */
      setSelectionHighlight: () => ReturnType
      /**
       * Toggle a selection highlight mark
       */
      toggleSelectionHighlight: () => ReturnType
      /**
       * Unset a selection highlight mark
       */
      unsetSelectionHighlight: () => ReturnType
    }
  }
}

export default Mark.create({
  name: 'selectionHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        class: 'selection',
      },
    ]
  },

  renderHTML() {
    return [
      'span',
      {
        // class: 'selection m-0 p-0 bg-blue-300 dark:bg-primary inline-block',
        class: 'selection bg-blue-300 dark:bg-primary',
      },
      0,
    ]
  },

  addCommands() {
    return {
      setSelectionHighlight:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name)
        },
      toggleSelectionHighlight:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name)
        },
      unsetSelectionHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {}
  },
})
