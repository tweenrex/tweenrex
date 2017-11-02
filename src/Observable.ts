import { IObserver, IAction, IObservable } from './types'

export class Observable<T> implements IObservable<T> {
    public afterNext?: IAction
    public beforeNext?: IAction
    public subs: IObserver<T>[] = []

    private _buffer: T[] = []

    public next = (n: T): void => {
        const self = this
        const buffer = self._buffer

        buffer.push(n)

        if (buffer.length > 1) {
            // if next is currently in progress, buffer
            return
        }

        for (let h = 0; h < buffer.length; h++) {
            // copy subscribers in case one subscriber unsubscribes a subsequent one
            const subs2 = self.subs.slice()
            const c = buffer[h]
            for (let i = 0; i < subs2.length; i++) {
                subs2[i](c)
            }
        }

        // clear the buffer
        buffer.length = 0

        // call after next hook
        if (self.afterNext) {
            self.afterNext()
        }
    }

    public subscribe = (fn: IObserver<T>): IAction => {
        const self = this
        const subs = self.subs
        if (self.beforeNext) {
            self.beforeNext()
        }
        subs.push(fn)
        return () => {
            const index = subs.indexOf(fn)
            if (index !== -1) {
                subs.splice(index, 1)
            }
        }
    }
}
