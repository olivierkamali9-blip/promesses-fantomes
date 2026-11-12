import type { Source } from '../engine/evidence'
import type { SafetyTier } from '../engine/safety'

export type Candidate = {
  title: string
  sourceUrl: string
  excerpt: string
  publishedAt: string
}

export type Draft = {
  question: string
  criteria: string
  deadline: string
  sides: {
    kept: {
      argument: string
      sourceUrl: string
    }
    broken: {
      argument: string
      sourceUrl: string
    }
  }
  sources: Source[]
  modelTier: SafetyTier
}
