import { TRexObservable } from './Observable'
import { IObservable } from './types'
import { onNextFrame } from './internal/onNextFrame'

export const scheduler: IObservable<number> = TRexObservable<number>({
    onSubscribe(): void {
        if (!this.subs.length) {
            onNextFrame(this.next)
        }
    },
    next(): void {
        if (this.subs.length) {
            onNextFrame(this.next)
        }
    }
})
