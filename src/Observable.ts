import { IObserver, IAction, IObservable } from './types'

export class Observable<T> implements IObservable<T> {
    public afterNext?: IAction
    public beforeNext?: IAction
    public subs: IObserver<T>[] = []

    private _buffer: T[] = []
    private _publishing: boolean
    public next = (n: T): void => {
        const self = this
        const buffer = this._buffer

        if (this._publishing) {
            // if next is currently in progress, buffer
            buffer.splice(0, 0, n)
            return
        }

        // mark observable as in progress
        this._publishing = true

        // set current to next value and mark as first run
        let c = n
        let firstRun = true
        do {
            if (!firstRun) {
                // if clearing the buffer, get the next value from the end
                c = self._buffer.pop()
            }

            // copy subscribers in case one subscriber unsubscribes a subsequent one
            const subs2 = self.subs.slice()
            for (let i = 0; i < subs2.length; i++) {
                subs2[i](c)
            }

            // mark first run false so additonal records are removed from the buffer
            firstRun = false
        } while (buffer.length)

        // mark this next as no longer publishing
        this._publishing = false

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
