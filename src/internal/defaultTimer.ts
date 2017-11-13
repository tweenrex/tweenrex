import { TRexObservable } from '../TRexObservable'
import { ITRexObservable } from '../types'
import { onNextFrame } from './onNextFrame'



const defaultTimer: ITRexObservable<number> = TRexObservable<number>({
    onSubscribe(subs): void {
        if (!subs.length) {
            onNextFrame(defaultTimer.next)
        }
    },
    onNext(value, subs): void {
        if (subs.length) {
            onNextFrame(defaultTimer.next)
        }
    }
})

export {defaultTimer}
