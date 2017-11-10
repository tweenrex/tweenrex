import { ITweenOptions, ITweenRex } from './types'
import { _ } from './internal/constants'
import { isString } from './internal/inspect'
import { newify } from './internal/newify';
import { TRexObservable } from './Observable'
import { scheduler } from './scheduler'

export function TweenRex(options: ITweenOptions): ITweenRex {
    // create and extend instance
    const self = TRexObservable<number, ITweenRex>(newify(this, TweenRex))
    const frameSize = options.frameSize
    self._scheduler = options.scheduler || scheduler
    self.duration = options.duration
    self.distinct = options.distinct !== false;
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
    get currentTime(this: ITweenRex): number {
        return this._time
    },
    set currentTime(this: ITweenRex, time: number) {
        this.seek(time)
    },
    get isPlaying(this: ITweenRex): boolean {
        return !!this._sub
    },
    play(this: ITweenRex): ITweenRex {
        const self = this
        if (!self.isPlaying) {
            const isForwards = self.playbackRate >= 0
            const duration = self.duration

            let n = self._time
            if (isForwards && n >= duration) {
                n = 0
            } else if (!isForwards && n <= 0) {
                n = duration
            }

            self._sub = self._scheduler.subscribe(self._tick)
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
