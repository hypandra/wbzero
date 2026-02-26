import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableImage } from './resizable-image'

/**
 * Custom TipTap image extension that adds an `imageId` attribute
 * linking back to the wbz_image record, a `width` attribute for
 * drag-to-resize persistence, and a React NodeView for interactive resizing.
 */
export const WbzImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      imageId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-image-id'),
        renderHTML: (attributes) => {
          if (!attributes.imageId) return {}
          return { 'data-image-id': attributes.imageId }
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const w = element.getAttribute('width')
          return w ? parseInt(w, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        renderHTML: () => ({}),
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage)
  },
})
