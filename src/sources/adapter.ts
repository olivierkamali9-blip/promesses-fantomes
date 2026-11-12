import type { Candidate } from '../ai/types'
import { FIXTURE_NEWS } from './fixtures'

export interface SourceAdapter {
  searchNews(query: string): Promise<Candidate[]>
}

export class FixtureAdapter implements SourceAdapter {
  constructor(private readonly candidates: readonly Candidate[] = FIXTURE_NEWS) {}

  searchNews(query: string): Promise<Candidate[]> {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr')
    const matches =
      normalizedQuery.length === 0
        ? this.candidates
        : this.candidates.filter((candidate) =>
            `${candidate.title} ${candidate.excerpt}`
              .toLocaleLowerCase('fr')
              .includes(normalizedQuery),
          )

    return Promise.resolve(matches.map((candidate) => ({ ...candidate })))
  }
}
