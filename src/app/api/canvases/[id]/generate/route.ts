import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

interface GeneratedNode {
  label: string
  type?: string
  content?: string
}

interface GeneratedEdge {
  from: number // index into nodes array
  to: number
  label?: string
}

interface GeneratedCanvas {
  nodes: GeneratedNode[]
  edges: GeneratedEdge[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: canvasId } = await params
  const { prompt } = await request.json()

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  // Verify canvas ownership
  const canvasResult = await pool.query(
    `SELECT c.id, c.project_id FROM wbz_canvas c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [canvasId, session.user.id]
  )

  if (canvasResult.rows.length === 0) {
    return NextResponse.json({ error: 'Canvas not found' }, { status: 404 })
  }

  // Get existing nodes to determine positioning
  const existingNodes = await pool.query(
    'SELECT position_x, position_y FROM wbz_canvas_node WHERE canvas_id = $1',
    [canvasId]
  )

  let startX = 100
  let startY = 100
  if (existingNodes.rows.length > 0) {
    const maxX = Math.max(...existingNodes.rows.map((n: { position_x: number }) => n.position_x))
    startX = maxX + 250
  }

  // Call LLM to generate nodes
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://wbzero.com',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'WBZero',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-haiku',
      messages: [
        {
          role: 'system',
          content: `You are a creative assistant helping to generate mind map / canvas nodes.
Given a prompt, generate a structured set of nodes and edges for a visual canvas.
Return JSON only, no markdown, in this exact format:
{
  "nodes": [
    { "label": "Node title", "type": "optional type tag", "content": "optional longer description" }
  ],
  "edges": [
    { "from": 0, "to": 1, "label": "optional edge label" }
  ]
}
- Generate 4-8 nodes typically
- Use "from" and "to" as indices into the nodes array
- Types could be: idea, character, location, event, theme, question, etc.
- Keep labels concise (2-5 words)
- Content is optional, use for additional context`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('LLM error:', error)
    return NextResponse.json({ error: 'Failed to generate nodes' }, { status: 500 })
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    return NextResponse.json({ error: 'No content from LLM' }, { status: 500 })
  }

  // Parse the JSON response
  let generated: GeneratedCanvas
  try {
    // Remove any markdown code blocks if present
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    generated = JSON.parse(jsonStr)
  } catch (e) {
    console.error('Failed to parse LLM response:', content)
    return NextResponse.json({ error: 'Failed to parse generated nodes' }, { status: 500 })
  }

  // Create nodes in database
  const createdNodes: Array<{ id: string; index: number }> = []

  for (let i = 0; i < generated.nodes.length; i++) {
    const node = generated.nodes[i]
    // Arrange in a grid pattern
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = startX + col * 220
    const y = startY + row * 150

    const result = await pool.query(
      `INSERT INTO wbz_canvas_node (canvas_id, label, type, content, position_x, position_y)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [canvasId, node.label, node.type || null, node.content || null, x, y]
    )
    createdNodes.push({ id: result.rows[0].id, index: i })
  }

  // Create edges
  const createdEdges: Array<{ id: string }> = []
  for (const edge of generated.edges) {
    const fromNode = createdNodes.find(n => n.index === edge.from)
    const toNode = createdNodes.find(n => n.index === edge.to)

    if (fromNode && toNode) {
      const result = await pool.query(
        `INSERT INTO wbz_canvas_edge (canvas_id, from_node_id, to_node_id, label)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [canvasId, fromNode.id, toNode.id, edge.label || null]
      )
      createdEdges.push({ id: result.rows[0].id })
    }
  }

  return NextResponse.json({
    success: true,
    nodesCreated: createdNodes.length,
    edgesCreated: createdEdges.length,
  })
}
