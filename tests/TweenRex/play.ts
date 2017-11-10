import { TweenRex } from '../../src/TweenRex'

describe('TweenRex.play()', () => {

    it('plays to the end', (done: Function) => {
        const obs = TweenRex({ duration: 100 })

        obs.subscribe((v: number) => {
            if (v === 1) {
                done()
            }
        })

        obs.play()
    })

    it('plays to the end when reversed', (done: Function) => {
        const obs = TweenRex({ duration: 100 })

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
})
