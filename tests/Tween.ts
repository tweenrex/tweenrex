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

    it('plays to the end', (done: Function) => {
        const obs = new Tween({ duration: 100 })

        obs.subscribe((v: number) => {
            if (v === 1) {
                done()
            }
        })

        obs.play()
    })

    it('plays to the end when reversed', (done: Function) => {
        const obs = new Tween({ duration: 100 })

        let offset1Hit: boolean
        obs.subscribe((v: number) => {
            if (v === 1) {
                offset1Hit = true
            }
            if (offset1Hit && v === 0) {
                done()
            }
        })

        obs.reverse().play()
    })

    it('seeks to the correct time', () => {
        const tween = new Tween({ duration: 100 })
        tween.seek(50)
        assert.equal(tween.currentTime, 50)
    })

    it('restart works properly', (done: Function) => {
        const tween = new Tween({ duration: 100 })

        let offset1Hit = 0
        tween.subscribe((v: number) => {
            if (v === 1) {
                offset1Hit++
                if (offset1Hit === 1) {
                    tween.restart()
                }
                if (offset1Hit === 2) {
                    done()
                }
            }
        })

        tween.play()
    })
})
