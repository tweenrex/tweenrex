import { IObserver, ITRexObservable, IObservableOptions } from './types'
import { removeAll, addAll, toArray } from './internal/arrays'
import { noOperation } from './internal/noOperation'

/**
 * Creates a new observable.
 */
export function TRexObservable<TValue>(options?: IObservableOptions<TValue>): ITRexObservable<TValue> {
    options = options || {}
    const distinct = options.distinct !== false
    const onNext = options.onNext || noOperation
    const onDispose = options.onDispose || noOperation
    const onSubscribe = options.onSubscribe || noOperation
    const onUnsubscribe = options.onUnsubscribe || noOperation
    const subs: IObserver<TValue>[] = toArray(options.subscribe || [])

    let c: TValue
    let buffer: TValue[]

    return {
        dispose() {
          // clear subscribers
          subs.length = 0
          onDispose()
        },
        next(n: TValue) {
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

                // skip value if distinct is true and the same value is recorded from last time
                if (!distinct || n !== c) {
                    c = n
                    for (let i = 0; i < subs2.length; i++) {
                        subs2[i](n)
                    }
                }
            }

            // clear the buffer
            buffer.length = 0

            // call after next hook
            onNext(n, subs)
        },
        subscribe(fn: IObserver<any>[]) {
            fn = toArray(fn)

            onSubscribe(subs)
            addAll(subs, fn)
            return () => {
                removeAll(subs, fn)
                onUnsubscribe(subs)
            }
        }
    }
}
