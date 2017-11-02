import { IAction, ITweenOptions, IObservable, ITween, IConsumer, IObserver } from './types'
import { Observable } from './Observable'
import { _ } from './constants'

let raf: IObserver<IConsumer<number>>
if (typeof window !== 'undefined') {
    raf = window.requestAnimationFrame
} else {
    raf = (fn: IConsumer<number>): void => {
        setTimeout(fn, 1000 / 60)
    }
}

const scheduler = new Observable<number>()
scheduler.beforeNext = function(): void {
    if (!this.subs.length) {
        raf(this.next)
    }
}
scheduler.afterNext = function(): void {
    if (this.subs.length) {
        raf(this.next)
    }
}

export class Tween extends Observable<number> implements ITween {
    public currentTime: number
    public duration: number
    public playbackRate: number
    private _frameSize: number
    private _lastTime: number
    private _scheduler: IObservable<number>
    private _sub: IAction

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
        const n = self.currentTime + (self._frameSize || (delta - (self._lastTime || delta)) * self.playbackRate)
        self._lastTime = delta
        self.seek(n)
    }
    public play(): void {
        const self = this
        if (!self.isPlaying) {
            const isForwards = self.playbackRate >= 0
            const duration = self.duration

            let n = self.currentTime
            if (isForwards && n >= duration) {
                n = 0
            } else if (!isForwards && n <= 0) {
                n = duration
            }

            self._sub = self._scheduler.subscribe(self.tick)
            self.seek(n)
        }
    }
    public pause(): void {
        const sub = this._sub
        if (sub) {
            sub()
            this._sub = _
        }
    }
    public reverse(): void {
        this.playbackRate *= -1
    }
    public seek(n: number): void {
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

        self.currentTime = n
        self.next(n / (duration || 1))
    }
}
