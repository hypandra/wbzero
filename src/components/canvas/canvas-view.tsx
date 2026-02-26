'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { useRouter } from 'next/navigation'
import { CanvasNode } from '@/components/canvas/canvas-node'
import { CanvasToolbar } from '@/components/canvas/canvas-toolbar'
import { useErrorAlert } from '@/components/error-alert-provider'
import { parseError } from '@/lib/api'
import { setMuseCanvasContext } from '@/lib/muses/context'
import { Loading } from '@/components/ui/spinner'

interface Canvas {
  id: string
  project_id: string
  title: string
}

interface CanvasNodeRecord {
  id: string
  canvas_id: string
  type: string | null
  label: string
  content: string | null
  chapter_id: string | null
  image_id: string | null
  position_x: number
  position_y: number
  color: string | null
}

interface CanvasEdgeRecord {
  id: string
  canvas_id: string
  from_node_id: string
  to_node_id: string
  label: string | null
}

interface Chapter {
  id: string
  title: string
}

const nodeTypes = {
  canvasNode: CanvasNode,
}

function CanvasFlow({ canvasId }: { canvasId: string }) {
  const router = useRouter()
  const { showError } = useErrorAlert()
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
  const { fitView, screenToFlowPosition } = useReactFlow()

  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingLayout, setIsSavingLayout] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const loadCanvas = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/canvases/${canvasId}/data`)
      if (!response.ok) {
        throw new Error('Failed to load canvas')
      }
      const data = await response.json()
      setCanvas(data.canvas)
      setNodes(
        data.nodes.map((node: CanvasNodeRecord) => ({
          id: node.id,
          type: 'canvasNode',
          position: { x: node.position_x, y: node.position_y },
          data: {
            label: node.label,
            type: node.type,
            content: node.content,
            chapter_id: node.chapter_id,
            image_id: node.image_id,
            color: node.color,
          },
        }))
      )
      setEdges(
        data.edges.map((edge: CanvasEdgeRecord) => ({
          id: edge.id,
          source: edge.from_node_id,
          target: edge.to_node_id,
          label: edge.label || undefined,
        }))
      )
    } catch (error) {
      // eslint-disable-next-line no-alert
      const { title, description } = parseError(error)
      showError(title, description)
    } finally {
      setIsLoading(false)
    }
  }, [canvasId, setEdges, setNodes])

  useEffect(() => {
    loadCanvas()
  }, [loadCanvas])

  useEffect(() => {
    if (!canvas) return
    const fetchChapters = async () => {
      const response = await fetch(`/api/projects/${canvas.project_id}`)
      if (!response.ok) return
      const data = await response.json()
      setChapters(data.chapters || [])
    }
    fetchChapters()
  }, [canvas])

  useEffect(() => {
    if (!canvas) return
    setMuseCanvasContext({
      id: canvas.id,
      title: canvas.title,
      nodes: nodes.map((node) => ({
        id: node.id,
        label: typeof node.data?.label === 'string' ? node.data.label : 'Untitled',
        content: typeof node.data?.content === 'string' ? node.data.content : null,
        chapter_id: typeof node.data?.chapter_id === 'string' ? node.data.chapter_id : null,
        image_id: typeof node.data?.image_id === 'string' ? node.data.image_id : null,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
      })),
    })

    return () => {
      setMuseCanvasContext(null)
    }
  }, [canvas, edges, nodes])

  const handleUpdateNode = useCallback(
    async (nodeId: string, updates: Partial<CanvasNodeRecord>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                position:
                  updates.position_x !== undefined || updates.position_y !== undefined
                    ? {
                        x: updates.position_x ?? node.position.x,
                        y: updates.position_y ?? node.position.y,
                      }
                    : node.position,
                data: {
                  ...node.data,
                  ...(() => {
                    const { position_x, position_y, ...rest } = updates
                    return rest
                  })(),
                },
              }
            : node
        )
      )

      const response = await fetch(`/api/canvases/${canvasId}/nodes/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        // eslint-disable-next-line no-alert
        showError('Failed to update node', 'Your changes may not have been saved.')
      }
    },
    [canvasId, setNodes]
  )

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId))
      setEdges((prev) =>
        prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      )

      const response = await fetch(`/api/canvases/${canvasId}/nodes/${nodeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // eslint-disable-next-line no-alert
        showError('Failed to delete node', 'Please try again.')
      }
    },
    [canvasId, setEdges, setNodes]
  )

  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        data: {
          ...node.data,
          chapters,
          onUpdate: handleUpdateNode,
          onDelete: handleDeleteNode,
          onOpenChapter: (chapterId: string) => {
            if (!canvas) return
            router.push(`/projects/${canvas.project_id}?chapter=${chapterId}`)
          },
        },
      }))
    )
  }, [chapters, canvas, handleDeleteNode, handleUpdateNode, router, setNodes])

  const createNodeAt = useCallback(
    async (position: { x: number; y: number }) => {
      const response = await fetch(`/api/canvases/${canvasId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'New node',
          position_x: position.x,
          position_y: position.y,
        }),
      })

      if (!response.ok) {
        // eslint-disable-next-line no-alert
        showError('Failed to create node', 'Please try again.')
        return null
      }

      const data = await response.json()
      const node = data.node as CanvasNodeRecord
      const flowNode: Node = {
        id: node.id,
        type: 'canvasNode',
        position: { x: node.position_x, y: node.position_y },
        data: {
          label: node.label,
          type: node.type,
          content: node.content,
          chapter_id: node.chapter_id,
          image_id: node.image_id,
          color: node.color,
          chapters,
          onUpdate: handleUpdateNode,
          onDelete: handleDeleteNode,
          onOpenChapter: (chapterId: string) => {
            if (!canvas) return
            router.push(`/projects/${canvas.project_id}?chapter=${chapterId}`)
          },
        },
      }
      setNodes((prev) => [...prev, flowNode])
      return flowNode
    },
    [canvas, canvasId, chapters, handleDeleteNode, handleUpdateNode, router, setNodes]
  )

  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return
      setConnectingNodeId(null)
      const response = await fetch(`/api/canvases/${canvasId}/edges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_node_id: connection.source,
          to_node_id: connection.target,
        }),
      })

      if (!response.ok) {
        // eslint-disable-next-line no-alert
        showError('Failed to create connection', 'Please try again.')
        return
      }

      const data = await response.json()
      setEdges((prev) =>
        addEdge(
          {
            id: data.edge.id,
            source: data.edge.from_node_id,
            target: data.edge.to_node_id,
            label: data.edge.label || undefined,
          },
          prev
        )
      )
    },
    [canvasId, setEdges]
  )

  const handleConnectEnd = useCallback(
    async (event: MouseEvent | TouchEvent) => {
      if (!connectingNodeId || !reactFlowWrapper.current) return
      const target = event.target as HTMLElement
      if (!target.classList.contains('react-flow__pane')) {
        setConnectingNodeId(null)
        return
      }

      const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX
      const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY
      const position = screenToFlowPosition({ x: clientX, y: clientY })
      const newNode = await createNodeAt(position)
      if (newNode) {
        await handleConnect({
          source: connectingNodeId,
          target: newNode.id,
          sourceHandle: null,
          targetHandle: null,
        })
      }
      setConnectingNodeId(null)
    },
    [connectingNodeId, createNodeAt, handleConnect, screenToFlowPosition]
  )

  const handleNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: Node) => {
      await handleUpdateNode(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      })
    },
    [handleUpdateNode]
  )

  const handleDeleteSelection = useCallback(async () => {
    const selectedNodes = nodes.filter((node) => node.selected)
    const selectedEdges = edges.filter((edge) => edge.selected)

    await Promise.all(
      selectedNodes.map((node) =>
        fetch(`/api/canvases/${canvasId}/nodes/${node.id}`, { method: 'DELETE' })
      )
    )
    await Promise.all(
      selectedEdges.map((edge) =>
        fetch(`/api/canvases/${canvasId}/edges/${edge.id}`, { method: 'DELETE' })
      )
    )

    setNodes((prev) => prev.filter((node) => !node.selected))
    setEdges((prev) => prev.filter((edge) => !edge.selected))
  }, [canvasId, edges, nodes, setEdges, setNodes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        handleDeleteSelection()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDeleteSelection])

  const handleAutoLayout = useCallback(async () => {
    if (nodes.length === 0) return
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 })

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 90 })
    })
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    setIsSavingLayout(true)
    const nextNodes = nodes.map((node) => {
      const { x, y } = dagreGraph.node(node.id)
      return {
        ...node,
        position: { x: x - 90, y: y - 45 },
      }
    })

    setNodes(nextNodes)

    await Promise.all(
      nextNodes.map((node) =>
        fetch(`/api/canvases/${canvasId}/nodes/${node.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position_x: node.position.x,
            position_y: node.position.y,
          }),
        })
      )
    )
    setIsSavingLayout(false)
  }, [canvasId, edges, nodes, setNodes])

  const handleAddNode = useCallback(async () => {
    if (!reactFlowWrapper.current) return
    const rect = reactFlowWrapper.current.getBoundingClientRect()
    const position = screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    await createNodeAt(position)
  }, [createNodeAt, screenToFlowPosition])

  const handleTitleSave = useCallback(
    async (title: string) => {
      if (!canvas) return
      setCanvas({ ...canvas, title })
      const response = await fetch(`/api/canvases/${canvas.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!response.ok) {
        // eslint-disable-next-line no-alert
        showError('Failed to update title', 'Your changes may not have been saved.')
      } else {
        // Dispatch event to notify right panel to refresh
        window.dispatchEvent(new CustomEvent('canvas-updated', { detail: { id: canvas.id, title } }))
      }
    },
    [canvas]
  )

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/canvases/${canvasId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate')
      }
      // Reload canvas to get new nodes
      await loadCanvas()
      // Auto-layout after generating
      setTimeout(() => handleAutoLayout(), 100)
    } catch (err) {
      const { title, description } = parseError(err)
      showError(title, description)
    } finally {
      setIsGenerating(false)
    }
  }, [canvasId, loadCanvas, handleAutoLayout])

  const minimapNodeColor = useCallback((node: Node): string => {
    if (node.data?.color && typeof node.data.color === 'string') return node.data.color
    if (node.data?.chapter_id) return '#10b981'
    return '#a1a1aa'
  }, [])

  const toolbarTitle = useMemo(() => canvas?.title || 'Canvas', [canvas?.title])

  if (isLoading) {
    return <Loading message="Loading canvas..." />
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col gap-4">
      <CanvasToolbar
        title={toolbarTitle}
        onTitleSave={handleTitleSave}
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onFitView={() => fitView({ padding: 0.2 })}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
      <div className="flex-1 rounded-lg border bg-white" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onConnectStart={(_, params) => setConnectingNodeId(params.nodeId)}
          onConnectEnd={handleConnectEnd}
          onNodeDragStop={handleNodeDragStop}
          onDoubleClick={(event) => {
            const target = event.target as HTMLElement
            if (!target.classList.contains('react-flow__pane')) return
            const position = screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            })
            createNodeAt(position)
          }}
          fitView
        >
          <MiniMap nodeColor={minimapNodeColor} />
          <Controls />
          <Background gap={24} size={1} />
        </ReactFlow>
      </div>
      {isSavingLayout ? (
        <div className="text-xs text-muted-foreground">Saving layout...</div>
      ) : null}
    </div>
  )
}

export function CanvasView({ canvasId }: { canvasId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasFlow canvasId={canvasId} />
    </ReactFlowProvider>
  )
}
