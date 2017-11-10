export interface IObserver<T> {
    (value: T): void
}

export interface IAction {
    (): void
}

export interface ITweenOptions {
    frameSize?: number
    duration?: number
    scheduler?: IObservable<number>
    labels?: Record<string, number>
}

export interface IObservable<TValue> {
    onSubscribe?: IAction
    onUnsubscribe?: IAction
    subs?: IObserver<TValue>[]
    next: IObserver<TValue>
    subscribe: (observer: IObserver<TValue>) => IAction
}

export interface ITweenRex extends IObservable<number> {
    _time: number
    _lastTime: number
    _scheduler: IObservable<number>
    _sub: IAction
    _tick: (delta: number) => void
    duration: number
    playbackRate: number
    labels: Record<string, number>
    currentTime: number
    isPlaying: boolean

    play(): ITweenRex
    restart(): ITweenRex
    pause(): ITweenRex
    reverse(): ITweenRex
    seek(n: number | string): ITweenRex
    /**
     * Gets the time at a particul label
     */
    getLabel(name: string): number
    /**
     * Sets a label at a particular time.  Set to undefined to clear.
     */
    setLabel(name: string, time?: number): ITweenRex
}

export interface IScrollOptions {
    direction?: 'x' | 'y'
    targets: string | Element
    scheduler?: IObservable<number>
}

export interface ITyrannoScrollus extends IObservable<number> {
    _scheduler: IObservable<number>
    _sub: IAction
    isPlaying: boolean
    target: Element
    tick: () => void
    play(): void
    pause(): void
}
