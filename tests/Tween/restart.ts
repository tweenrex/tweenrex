import { Tween } from '../../src/Tween'

describe('Tween.restart()', () => {
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
