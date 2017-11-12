import { ITweenOptions, ITweenRex, IAction, ITweenRexAddOptions } from './types'
import { _ } from './internal/constants'
import { isString, isArray } from './internal/inspect'
import { newify } from './internal/newify'
import { TRexObservable } from './Observable'
import { scheduler } from './scheduler'
import { addAll, removeAll } from './internal/arrays'
import { minMax } from './internal/math'
import { coalesce } from './internal/colesce';

export function TweenRex(options?: ITweenOptions): ITweenRex {
    options = options || {}

    // create and extend instance
    const self = TRexObservable<number, ITweenRex>(newify(this, TweenRex))
    const frameSize = options.frameSize
    self._cursor = options.duration || 0
    self._scheduler = options.scheduler || scheduler
    self.distinct = options.distinct !== false
    self.currentTime = 0
    self.playbackRate = 1
    self.labels = options.labels || {}

    self._tick = (delta: number) => {
        const n = self._time + (frameSize || (delta - (self._lastTime || delta)) * self.playbackRate)
        self._lastTime = delta
        self.seek(n)
    }

    return self
}

TweenRex.prototype = {
    get duration(this: ITweenRex): number {
        const self = this
        const tweens = self._tweens

        let maxSize = self._cursor
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
        this._cursor = value
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

        const _tweens = self._tweens
        if (!isArray(tweens)) {
            tweens = [tweens]
        }

        // set option defaults
        opts = opts || {}

        let pos = coalesce(opts.position, self.duration)
        const seq = opts.sequence

        // create position + tween objects
        const ilen = tweens.length
        const tweenObjs: typeof _tweens = Array(ilen)
        for (let i = 0; i < ilen; i++) {
            const tween = tweens[i]

            // tell tween to stop current playing
            if (tween.isPlaying) {
                tween.pause()
            }
            // unhook tween from global scheduler
            tween._scheduler = _

            // add to list of tweens
            tweenObjs[i] = { pos, tween }

            if (seq) {
              // move the position if this is a sequence
              pos += tween.duration
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
        const scheduler = self._scheduler
        if (scheduler && !self.isPlaying) {
            const isForwards = self.playbackRate >= 0
            const duration = self.duration

            let n = self._time
            if (isForwards && n >= duration) {
                n = 0
            } else if (!isForwards && n <= 0) {
                n = duration
            }

            self._sub = scheduler.subscribe(self._tick)
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
            self._sub = self._lastTime = _
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
                const endPos = startPos + tween.duration
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
