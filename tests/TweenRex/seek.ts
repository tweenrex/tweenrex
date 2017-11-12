import { assert } from 'chai'
import { TweenRex } from '../../src/TweenRex'

describe('TweenRex.seek()', () => {
    test('moves to the correct time', () => {
        const tween = TweenRex({ duration: 100 })
        tween.seek(50)
        assert.equal(tween.currentTime, 50)
    })
})
