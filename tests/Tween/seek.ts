import { assert } from 'chai'
import { Tween } from '../../src/Tween'

describe('Tween.seek()', () => {
    it('moves to the correct time', () => {
        const tween = new Tween({ duration: 100 })
        tween.seek(50)
        assert.equal(tween.currentTime, 50)
    })
})
