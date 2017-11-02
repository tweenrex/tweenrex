import { assert } from 'chai'
import { Tween } from '../src/Tween'

describe('Tween()', () => {
    it('publishes values to subscribers', () => {
        const obs = new Tween({
            duration: 1000
        })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        assert.equal(i, 2)
    })
})

describe('Tween()', () => {
    it('publishes values to subscribers', () => {
        const obs = new Tween({ duration: 100 })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        assert.equal(i, 2)
    })

    it('publishes multiple values to subscribers', () => {
        const obs = new Tween({ duration: 100 })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        obs.next(2)
        assert.equal(i, 4)
    })

    it('unsubscribes properly', () => {
        const obs = new Tween({ duration: 100 })

        let i = 0
        const unsubscribe = obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        unsubscribe()
        obs.next(2)

        assert.equal(i, 2)
    })
})
