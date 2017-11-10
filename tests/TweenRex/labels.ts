import { assert } from 'chai'
import { TweenRex } from '../../src/TweenRex'

describe('TweenRex.setLabel()', () => {
    it('seeks to a label', () => {
        const tween = TweenRex({ duration: 100 })
        tween.setLabel('three-quarters', 75)

        tween.seek('three-quarters')
        assert.equal(tween.currentTime, 75)
    })

    it('seeks to a label defined in the constructor', () => {
        const tween = TweenRex({
            duration: 100,
            labels: {
                seventyFive: 75
            }
        })
        tween.seek('seventyFive')
        assert.equal(tween.currentTime, 75)
    })
})
