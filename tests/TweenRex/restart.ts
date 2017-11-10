import { TweenRex } from '../../src/TweenRex'

describe('TweenRex.restart()', () => {
    it('restart works properly', (done: Function) => {
        const tween = TweenRex({ duration: 100 })

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
