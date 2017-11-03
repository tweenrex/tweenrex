import { IAction, ITweenOptions, IObservable } from './types'
import { Observable } from './Observable'
import { _ } from './constants'
import { scheduler } from './scheduler'

export class Tween extends Observable<number> {
    public duration: number
    public playbackRate: number
    private _time: number
    private _frameSize: number
    private _lastTime: number
    private _scheduler: IObservable<number>
    private _sub: IAction

    public get currentTime(): number {
        return this._time
    }
    public set currentTime(time: number) {
        this.seek(time)
    }
    public get isPlaying(): boolean {
        return !!this._sub
    }

    constructor(options: ITweenOptions) {
        super()
        options = options || {}
        const self = this instanceof Tween ? this : Object.create(Tween.prototype)
        self._scheduler = options.scheduler || scheduler
        self._frameSize = options.frameSize
        self.duration = options.duration
        self.currentTime = 0
        self.playbackRate = 1
        return self
    }

    public tick = (delta: number) => {
        const self = this
        const n = self._time + (self._frameSize || (delta - (self._lastTime || delta)) * self.playbackRate)
        self._lastTime = delta
        self.seek(n)
    }
    public play(): this {
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

            self._sub = self._scheduler.subscribe(self.tick)
            self.seek(n)
        }
        return self
    }
    public restart(): this {
        const self = this
        return self
            .pause()
            .seek(self.playbackRate >= 0 ? 0 : self.duration)
            .play()
    }
    public pause(): this {
        const self = this
        const sub = self._sub
        if (sub) {
            sub()
            self._sub = self._lastTime = _
        }
        return self
    }
    public reverse(): this {
        this.playbackRate *= -1
        return this
    }
    public seek(n: number): this {
        const self = this
        const isForwards = self.playbackRate >= 0
        const duration = self.duration

        if (isForwards && n >= duration) {
            n = duration
            self.pause()
        } else if (!isForwards && n <= 0) {
            n = 0
            self.pause()
        }

        self._time = n
        self.next(n / (duration || 1))
        return self
    }
}
