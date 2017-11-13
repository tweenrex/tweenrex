import { assert } from 'chai'
import { TyrannoScrollus } from '../../src/TyrannoScrollus'
import { IScrollable } from '../../src/types'

describe('TyrannoScrollus()', () => {
    test('publishes values to subscribers', () => {
        jest.useFakeTimers()
        const target: IScrollable = {
            tagName: 'DIV',
            scrollLeft: 0,
            scrollWidth: 1200,
            clientWidth: 300,
            clientHeight: 0,
            scrollHeight: 0,
            scrollTop: 0
        }

        let i: number
        const obs = TyrannoScrollus({
            direction: 'x',
            targets: target,
            subscribe(o) {
                i = 0.5
            }
        })

        target.scrollLeft = 600

        // observe changes
        obs.play()
        assert.equal(i, 0.5)
    })
})
