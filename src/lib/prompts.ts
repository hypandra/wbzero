export const DEFAULT_PROMPT_TEMPLATE =
  'Generate an illustration for this excerpt. Style: colorful, imaginative, suitable for a young audience. Do not include any text in the image.'

export function renderPromptTemplate(template: string, sourceText: string): string {
  const trimmed = template.trim()
  if (trimmed.includes('{{source_text}}')) {
    return trimmed.replaceAll('{{source_text}}', sourceText)
  }
  return `${trimmed}\n\n"${sourceText}"`
}
