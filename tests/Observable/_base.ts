import { assert } from 'chai'
import { TRexObservable } from '../../src/TRexObservable'

describe('Observable()', () => {
    it('publishes values to subscribers', () => {
        const obs = TRexObservable<number>()

        let i = 0
        obs.subscribe((v: number) => (i += v))

        obs.next(2)
        assert.equal(i, 2)
    })

    it('publishes multiple values to subscribers', () => {
        const obs = TRexObservable<number>()

        let i = 0
        obs.subscribe((v: number) => (i += v))

        obs.next(2)
        obs.next(3)
        assert.equal(i, 5)
    })

    it('unsubscribes properly', () => {
        const obs = TRexObservable<number>()

        let i = 0
        const unsubscribe = obs.subscribe((v: number) => (i += v))

        obs.next(2)
        unsubscribe()
        obs.next(2)

        assert.equal(i, 2)
    })

    it('disposes properly', () => {
        const obs = TRexObservable<number>()

        let i = 0
        obs.subscribe((v: number) => (i += v))

        obs.next(2)
        obs.dispose()
        obs.next(2)

        assert.equal(i, 2)
    })

    it('calls onDispose when dispose is called', done => {
        const obs = TRexObservable<number>({
            onDispose: done
        })

        obs.dispose()
    })

    it('provides values in the same order that they were published', () => {
        const obs = TRexObservable<number>()

        let values: number[] = []
        obs.subscribe((v: number) => {
            values.push(v)
            if (v === 2) {
                obs.next(5)
            }
        })
        obs.subscribe((v: number) => {
            values.push(v)
        })

        obs.next(2)
        obs.next(2)
        assert.deepEqual(values, [2, 2, 5, 5, 2, 2, 5, 5])
    })

    it('allows configuration of multiple observers under a single subscription', () => {
        const obs = TRexObservable<number>()

        let values: number[] = []
        obs.subscribe([o => values.push(o), o => values.push(o * o)])

        obs.next(2)
        assert.deepEqual(values, [2, 4])
    })
})
