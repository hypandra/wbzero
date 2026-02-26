export interface MuseContextImage {
  id: string
  url: string
  source_text: string
  chapter_id?: string | null
}

export interface MuseDocumentContext {
  id: string
  title: string
  content: string
  path?: string
}

export interface MuseCanvasNodeContext {
  id: string
  label: string
  content?: string | null
  chapter_id?: string | null
  image_id?: string | null
}

export interface MuseCanvasEdgeContext {
  id: string
  source: string
  target: string
  label?: string
}

export interface MuseCanvasContext {
  id: string
  title: string
  nodes: MuseCanvasNodeContext[]
  edges: MuseCanvasEdgeContext[]
}

export interface MuseContext {
  projectId?: string
  filePath?: string
  document?: MuseDocumentContext
  canvas?: MuseCanvasContext
  images?: MuseContextImage[]
}

let currentDocumentContext: MuseDocumentContext | null = null
let currentCanvasContext: MuseCanvasContext | null = null

export function setMuseDocumentContext(context: MuseDocumentContext | null) {
  currentDocumentContext = context
}

export function setMuseCanvasContext(context: MuseCanvasContext | null) {
  currentCanvasContext = context
}

export function getMuseContext(params: {
  projectId?: string | null
  images?: MuseContextImage[]
  filePath?: string | null
}): MuseContext {
  const filePath = params.filePath
    ?? (typeof window !== 'undefined' ? window.location.pathname : undefined)

  return {
    projectId: params.projectId ?? undefined,
    filePath,
    document: currentDocumentContext ?? undefined,
    canvas: currentCanvasContext ?? undefined,
    images: params.images ?? undefined,
  }
}
