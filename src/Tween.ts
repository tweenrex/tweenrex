import { IAction, ITweenOptions, IObservable, ITween } from './types'
import { Observable } from './Observable'

const raf = window.requestAnimationFrame

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
        const self = this
        self._scheduler = options.scheduler || scheduler
        self._frameSize = options.frameSize
        self.duration = options.duration
        self.currentTime = 0
        self.playbackRate = 1
    }

    public tick = (delta: number) => {
        const self = this
        const n = self.currentTime + (self._frameSize || (delta - (self._lastTime || delta)) * self.playbackRate)
        self._lastTime = delta
        self.seek(n)
    }
    public play(): void {
        const self = this
        self._sub = self._sub || self._scheduler.subscribe(self.tick)
    }
    public pause(): void {
        if (this._sub) {
            this._sub()
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
