export interface IrisSource {
  title: string
  url: string
  notes: string
}

export interface IrisPackage {
  intro: string
  headline: string
  summary: string
  sources: IrisSource[]
  followups?: string[]
}

export function extractJsonObject(content: string) {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  const candidate = content.slice(start, end + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}
