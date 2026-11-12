import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { LifecycleState } from '../engine/lifecycle'
import { buildEpitaph, selectBrokenPledges } from './cemeteryProps'

const lifecycleStateArbitrary = fc.constantFrom<LifecycleState>(
  'MURMUR',
  'APPARITION',
  'HAUNTING',
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
)

describe('cemetery props', () => {
  it('builds a calm, non-empty epitaph without prohibited language', () => {
    fc.assert(
      fc.property(
        lifecycleStateArbitrary,
        fc.integer({ min: -100, max: 100 }),
        (state, evidenceLevel) => {
          const epitaph = buildEpitaph({ state, evidenceLevel })

          expect(epitaph.trim().length).toBeGreaterThan(0)
          expect(epitaph.toLocaleLowerCase('fr')).not.toContain('mensonge')
          expect(epitaph.toLocaleLowerCase('fr')).not.toMatch(
            /idiot|imbécile|stupide|incapable|escroc/,
          )
        },
      ),
    )
  })

  it('contains exactly the BROKEN pledges', () => {
    const pledgeArbitrary = fc.record({
      id: fc.uuid(),
      state: lifecycleStateArbitrary,
    })

    fc.assert(
      fc.property(fc.array(pledgeArbitrary), (pledges) => {
        const cemetery = selectBrokenPledges(pledges)
        const expected = pledges.filter((pledge) => pledge.state === 'BROKEN')

        expect(cemetery).toEqual(expected)
        expect(cemetery.every((pledge) => pledge.state === 'BROKEN')).toBe(true)
      }),
    )
  })
})
