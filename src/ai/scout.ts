import type { SourceAdapter } from '../sources/adapter'
import type { Candidate } from './types'

export function scout(
  adapter: SourceAdapter,
  query: string,
): Promise<Candidate[]> {
  return adapter.searchNews(query)
}
