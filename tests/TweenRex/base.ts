import { assert } from 'chai'
import { TweenRex } from '../../src/TweenRex'

describe('Tween()', () => {
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
})
