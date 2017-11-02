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
}

export interface IObservable<TValue> {
    afterNext?: IAction
    beforeNext?: IAction
    subs?: IObserver<TValue>[]
    next: IObserver<TValue>
    subscribe: (observer: IObserver<TValue>) => IAction
}

export interface ITween {
    duration: number
    playbackRate: number
    currentTime: number
    isPlaying: boolean
    play(): void
    pause(): void
    reverse(): void
    seek(n: number): void
}
