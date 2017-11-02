import { assert } from 'chai'
import { Observable } from '../src/Observable'

describe('Observable()', () => {
    it('publishes values to subscribers', () => {
        const obs = new Observable<number>()

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        assert.equal(i, 2)
    })

    it('publishes multiple values to subscribers', () => {
        const obs = new Observable<number>()

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        obs.next(2)
        assert.equal(i, 4)
    })

    it('unsubscribes properly', () => {
        const obs = new Observable<number>()

        let i = 0
        const unsubscribe = obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        unsubscribe()
        obs.next(2)

        assert.equal(i, 2)
    })

    it('provides values in the same order that they were published', () => {
        const obs = new Observable<number>()

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
})
