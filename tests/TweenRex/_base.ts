import { assert } from 'chai'
import { TweenRex } from '../../src/TweenRex'

describe('TweenRex()', () => {
    it('publishes values to subscribers', () => {
        const obs = TweenRex({
            duration: 1000
        })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        assert.equal(i, 2)
    })

    it('publishes values to subscribers', () => {
        const obs = TweenRex({ duration: 100 })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        assert.equal(i, 2)
    })

    it('publishes multiple values to subscribers', () => {
        const obs = TweenRex({ duration: 100 })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        obs.next(3)
        assert.equal(i, 5)
    })

    it('unsubscribes properly', () => {
        const obs = TweenRex({ duration: 100 })

        let i = 0
        const unsubscribe = obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        unsubscribe()
        obs.next(2)

        assert.equal(i, 2)
    })

    it('seeks to the correct time', () => {
        const tween = TweenRex({ duration: 100 })
        tween.seek(50)
        assert.equal(tween.currentTime, 50)
    })

    it('allows configuration of multiple observers under a single subscription', () => {
        const obs = TweenRex({ duration: 1000 })

        let values: number[] = []

        // prettier-ignore
        obs.subscribe([
          o => values.push(o),
          o => values.push(o*o)
        ])

        obs.seek(500)
        assert.deepEqual(values, [0.5, 0.25])
    })

    it('honors unsubscribing multiple observers', () => {
      const obs = TweenRex({ duration: 1000 })

      let values: number[] = []

      // prettier-ignore
      const unsubscribe = obs.subscribe([
        o => values.push(o),
        o => values.push(o*o)
      ])

      unsubscribe()

      obs.seek(500)
      assert.deepEqual(values, [])
  })
})
