import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  canResolve,
  evidenceLevel,
  resolveOutcome,
  type ProposedOutcome,
  type Source,
  type SourceKind,
} from './evidence'

const sourceKindArbitrary: fc.Arbitrary<SourceKind> = fc.constantFrom(
  'statement',
  'reliable',
  'official',
)
const sourceArbitrary: fc.Arbitrary<Source> = fc.record({
  url: fc.webUrl(),
  kind: sourceKindArbitrary,
  independentGroup: fc.string({ minLength: 1, maxLength: 20 }),
})
const sourcesArbitrary = fc.array(sourceArbitrary, { maxLength: 30 })
const outcomeArbitrary: fc.Arbitrary<ProposedOutcome> = fc.constantFrom('KEPT', 'BROKEN')

function source(kind: SourceKind, independentGroup: string): Source {
  return {
    url: `https://example.com/${kind}/${independentGroup}`,
    kind,
    independentGroup,
  }
}

describe('evidence examples', () => {
  it('assigns levels 0, 1, and 2 to basic evidence', () => {
    expect(evidenceLevel([])).toBe(0)
    expect(evidenceLevel([source('statement', 'speaker')])).toBe(1)
    expect(evidenceLevel([source('reliable', 'newsroom-a')])).toBe(2)
  })

  it('assigns level 3 to independent reliable sources and level 4 to official evidence', () => {
    expect(
      evidenceLevel([
        source('reliable', 'newsroom-a'),
        source('reliable', 'newsroom-b'),
      ]),
    ).toBe(3)
    expect(evidenceLevel([source('official', 'ministry')])).toBe(4)
  })

  it('resolves only evidence at level 3 or 4', () => {
    expect(canResolve(2)).toBe(false)
    expect(canResolve(3)).toBe(true)
    expect(canResolve(4)).toBe(true)
    expect(resolveOutcome([source('reliable', 'newsroom-a')], 'KEPT')).toEqual({
      status: 'INCONCLUSIVE',
    })
    expect(
      resolveOutcome(
        [source('reliable', 'newsroom-a'), source('reliable', 'newsroom-b')],
        'BROKEN',
      ),
    ).toEqual({ status: 'RESOLVED', outcome: 'BROKEN' })
  })
})

describe('evidence properties', () => {
  it('P4: never resolves evidence below level 3', () => {
    fc.assert(
      fc.property(sourcesArbitrary, outcomeArbitrary, (sources, proposed) => {
        const level = evidenceLevel(sources)

        if (level < 3) {
          expect(resolveOutcome(sources, proposed).status).not.toBe('RESOLVED')
        }
      }),
    )
  })

  it('never lowers the evidence level when a source is added', () => {
    fc.assert(
      fc.property(sourcesArbitrary, sourceArbitrary, (sources, addedSource) => {
        expect(evidenceLevel([...sources, addedSource])).toBeGreaterThanOrEqual(
          evidenceLevel(sources),
        )
      }),
    )
  })

  it('keeps two reliable sources from the same independent group at level 2', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.webUrl(),
        fc.webUrl(),
        (independentGroup, firstUrl, secondUrl) => {
          const sources: Source[] = [
            { url: firstUrl, kind: 'reliable', independentGroup },
            { url: secondUrl, kind: 'reliable', independentGroup },
          ]

          expect(evidenceLevel(sources)).toBe(2)
        },
      ),
    )
  })
})
