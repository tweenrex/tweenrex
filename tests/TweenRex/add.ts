import { assert } from 'chai'
import { TweenRex } from '../../src/TweenRex'

describe('TweenRex.add()', () => {
    test('adds sub-tweens at the current duration of the tween', () => {
        const value: number[] = []

        const tween1 = TweenRex({ duration: 500 })
        tween1.subscribe(o => value.push(o))

        const timeline = TweenRex({ duration: 1000 })
        timeline.add(tween1)
        timeline.seek(1250)

        assert.deepEqual(value, [0.5])
    })

    test('out of range sub-tweens are reported as 0 when in the future', () => {
        const value: number[] = []

        const tween1 = TweenRex({ duration: 500, distinct: false })
        tween1.subscribe(o => value.push(o))

        const timeline = TweenRex({ duration: 1000 })
        timeline.add(tween1)
        timeline.seek(250)

        assert.deepEqual(value, [0])
    })

    test('tweens added can be unsubscribed', () => {
        const value: number[] = []

        const tween1 = TweenRex({ duration: 500 })
        tween1.subscribe(o => value.push(o))

        const timeline = TweenRex({ duration: 1000 })
        const unsubscribe = timeline.add(tween1)

        unsubscribe()
        timeline.seek(1250)

        assert.deepEqual(value, [])
    })

    test('adds multiple sub-tweens to the same point in time', () => {
        const value: number[] = []

        const tween1 = TweenRex({ duration: 500 })
        tween1.subscribe(o => value.push(o))

        const tween2 = TweenRex({ duration: 1000 })
        tween2.subscribe(o => value.push(o))

        const timeline = TweenRex()
        timeline.add([tween1, tween2])
        timeline.seek(500)

        assert.deepEqual(value, [1, 0.5])
    })

    test('increases the timeline by the max duration', () => {
        const timeline = TweenRex()
        timeline.add([TweenRex({ duration: 500 }), TweenRex({ duration: 1000 })])

        assert.equal(timeline.duration, 1000)
    })

    test('configures as a sequence when the sequence option is set', () => {
        const value: number[] = []

        const timeline = TweenRex()

        const tween1 = TweenRex({ duration: 500 })
        tween1.subscribe(o => value.push(o))

        const tween2 = TweenRex({ duration: 1000 })
        tween2.subscribe(o => value.push(o))

        timeline.add([tween1, tween2], { sequence: true })
        timeline.seek(1000)

        assert.deepEqual(value, [1, 0.5])
    })

    test('extends the tween by each segment of a sequence', () => {
        const timeline = TweenRex()
        const tween1 = TweenRex({ duration: 500 })
        const tween2 = TweenRex({ duration: 1000 })

        timeline.add([tween1, tween2], { sequence: true })

        assert.equal(timeline.duration, 1500)
    })

    test('options passed to add are automatically converted to TweenRex', () => {
        const values: number[] = []

        const timeline = TweenRex()
        timeline.add({
            duration: 500
        })

        timeline.seek(250)

        assert.deepEqual(timeline.duration, 500)
    })

    test('a subscription is automatically added to TweenRex', () => {
        const values: number[] = []

        const timeline = TweenRex()
        timeline.add({
            duration: 500,
            subscribe: o => values.push(o)
        })

        timeline.seek(250)

        assert.deepEqual(values, [0.5])
    })

    test('subscriptions are automatically added to TweenRex', () => {
        const values: number[] = []

        const timeline = TweenRex()
        timeline.add({
            duration: 500,
            subscribe: [o => values.push(o), o => values.push(o * 2)]
        })

        timeline.seek(250)

        assert.deepEqual(values, [0.5, 1])
    })

    test('position can be set to a label name', () => {
        const timeline = TweenRex({
            labels: {
                middle: 250
            }
        })
        timeline.add(
            {
                duration: 500
            },
            {
                position: 'middle'
            }
        )

        assert.equal(timeline.duration, 750)
    })
})
