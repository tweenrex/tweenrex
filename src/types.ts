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
    onNext?: IAction
    onSubscribe?: IAction
    subs?: IObserver<TValue>[]
    next: IObserver<TValue>
    subscribe: (observer: IObserver<TValue>) => IAction
}
