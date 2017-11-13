import { ITweenOptions, ITweenRex, IAction, ITweenRexAddOptions } from './types'
import { _ } from './internal/constants'
import { isString } from './internal/inspect'
import { newify } from './internal/newify'
import { TRexObservable } from './TRexObservable'
import { defaultTimer } from './internal/defaultTimer'
import { addAll, removeAll, toArray } from './internal/arrays'
import { minMax } from './internal/math'
import { coalesce } from './internal/colesce'

/**
 * Creates a TweenRex instance.  This allows tweening over a period of time with playback controls.
 */
export function TweenRex(opts?: ITweenOptions | ITweenRex): ITweenRex {
    if (opts instanceof TweenRex) {
        return opts as ITweenRex
    }

    const options = (opts || {}) as ITweenOptions

    // create and extend instance
    const self = newify<ITweenRex>(this, TweenRex)
    self._timer = options.timer || defaultTimer
    self._pos = options.duration || 0
    self._time = 0
    self.labels = options.labels || {}
    self.playbackRate = 1

    const frameSize = options.frameSize

    self._tick = (delta: number) => {
        const n = self._time + (frameSize || (delta - (self._last || delta)) * self.playbackRate)
        self._last = delta
        self.seek(n)
    }

    // copy next/subscribe to this object
    const obs = TRexObservable<number>(options)
    self.dispose = () => {
        // pause timeline to clear active state
        self.pause()

        // reset internal state
        self._pos = 0
        self._time = 0
        self.playbackRate = 1
        self._tweens = _
        self.labels = {}

        // dispose the observable
        obs.dispose()
    }
    self.next = obs.next
    self.subscribe = obs.subscribe

    return self
}

TweenRex.prototype = {
    get duration(this: ITweenRex): number {
        const self = this
        const tweens = self._tweens

        let maxSize = self._pos
        if (tweens) {
            for (let i = 0, ilen = tweens.length; i < ilen; i++) {
                const t = tweens[i]
                const size = t.pos + t.tween.duration
                if (maxSize < size) {
                    maxSize = size
                }
            }
        }
        return maxSize
    },
    set duration(this: ITweenRex, value: number) {
        this._pos = value
    },
    get currentTime(this: ITweenRex): number {
        return this._time
    },
    set currentTime(this: ITweenRex, time: number) {
        this.seek(time)
    },
    get isPlaying(this: ITweenRex): boolean {
        return !!this._sub
    },
    add(this: ITweenRex, tweens: ITweenRex[], opts?: ITweenRexAddOptions): IAction {
        const self = this
        if (!self._tweens) {
            self._tweens = []
        }

        tweens = toArray(tweens)
        const _tweens = self._tweens

        // set option defaults
        opts = opts || {}

        let pos = coalesce(
            isString(opts.position) ? self.labels[opts.position] : opts.position as number,
            self.duration
        )

        const seq = opts.sequence
        const stagger = opts.stagger

        // create position + tween objects
        const ilen = tweens.length
        const tweenObjs: typeof _tweens = Array(ilen)
        for (let i = 0; i < ilen; i++) {
            // wrap in TweenRex to ensure it is a TweenRex instance
            const tween = TweenRex(tweens[i])

            // tell tween to stop current playing
            if (tween.isPlaying) {
                tween.pause()
            }
            // unhook tween from timer
            tween._timer = _

            // add to list of tweens
            tweenObjs[i] = { pos, tween }

            if (seq) {
                // move the position if this is a sequence
                pos += tween.duration
            }
            if (stagger) {
                pos += stagger
            }
        }

        // add to list of tweens
        addAll(_tweens, tweenObjs)

        return () => {
            // unsubscribe all
            removeAll(_tweens, tweenObjs)
        }
    },
    play(this: ITweenRex): ITweenRex {
        const self = this
        const timer = self._timer
        if (timer && !self.isPlaying) {
            const isForwards = self.playbackRate >= 0
            const duration = self.duration

            let n = self._time
            if (isForwards && n >= duration) {
                n = 0
            } else if (!isForwards && n <= 0) {
                n = duration
            }

            self._sub = timer.subscribe(self._tick)
            self.seek(n)
        }
        return self
    },
    restart(this: ITweenRex): ITweenRex {
        const self = this
        return self
            .pause()
            .seek(self.playbackRate >= 0 ? 0 : self.duration)
            .play()
    },
    pause(this: ITweenRex): ITweenRex {
        const self = this
        const sub = self._sub
        if (sub) {
            sub()
            self._sub = self._last = _
        }
        return self
    },
    reverse(this: ITweenRex): ITweenRex {
        this.playbackRate *= -1
        return this
    },
    seek(this: ITweenRex, n: number | string): ITweenRex {
        const self = this
        const isForwards = self.playbackRate >= 0
        const duration = self.duration
        const tweens = self._tweens

        // resolve label
        let c = isString(n) ? self.labels[n as string] : n as number

        if (isForwards && c >= duration) {
            c = duration
            self.pause()
        } else if (!isForwards && c <= 0) {
            c = 0
            self.pause()
        }

        self._time = c
        self.next(c / (duration || 1))

        // update sub-timelines
        if (tweens) {
            // determine if in range and perform an update
            for (let i = 0, ilen = tweens.length; i < ilen; i++) {
                const t = tweens[i]
                const tween = t.tween
                const startPos = t.pos
                const endPos = startPos + (tween.duration || 1)
                const offset = minMax((c - startPos) / (endPos - startPos), 0, 1)
                tween.next(offset)
            }
        }

        return self
    },
    getLabel(this: ITweenRex, name: string): number {
        return this.labels[name]
    },
    setLabel(this: ITweenRex, name: string, time?: number): ITweenRex {
        this.labels[name] = time
        return this
    }
}
