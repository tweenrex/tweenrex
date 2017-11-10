import { IObserver, IAction, IObservable } from './types'
import { inherit } from './internal/inherit'

export function TRexObservable<TValue, T extends {} = {}>(input?: T): T & IObservable<TValue> {
    // lie to the TypeScript compiler
    const self = ((input || {}) as any) as T & IObservable<TValue>
    const next: IObserver<TValue> = self.next && self.next.bind(self)
    const subs: IObserver<TValue>[] = (self.subs = [])

    let c: TValue
    let buffer: TValue[]
    self.next = (n: TValue): void => {
        if (!buffer) {
            buffer = []
        }

        buffer.push(n)

        if (buffer.length > 1) {
            // if next is currently in progress, buffer
            return
        }

        for (let h = 0; h < buffer.length; h++) {
            // copy subscribers in case one subscriber unsubscribes a subsequent one
            const subs2 = subs.slice()
            const n = buffer[h]

            // skip value if
            if (self.distinct && n === c) {
              continue
            }
            c = n
            for (let i = 0; i < subs2.length; i++) {
                subs2[i](n)
            }
        }

        // clear the buffer
        buffer.length = 0

        // call after next hook
        if (next) {
            next(n)
        }
    }

    // add observable prototype
    inherit(self, TRexObservable.prototype)

    return self
}

TRexObservable.prototype = {
    subscribe(fn: IObserver<any>): IAction {
        const self = this
        const subs = self.subs
        if (self.onSubscribe) {
            self.onSubscribe(fn)
        }
        subs.push(fn)
        return () => {
            const index = subs.indexOf(fn)
            if (index !== -1) {
                subs.splice(index, 1)
                if (self.onUnsubscribe) {
                    self.onUnsubscribe(fn)
                }
            }
        }
    }
}
