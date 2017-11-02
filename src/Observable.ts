import { IObserver, IAction, IObservable } from './types'

export class Observable<T> implements IObservable<T> {
    public afterNext?: IAction
    public beforeNext?: IAction
    public subs: IObserver<T>[] = []
    public next = (n: T): void => {
        const self = this
        const subs2 = self.subs.slice()
        for (let i = 0; i < subs2.length; i++) {
            subs2[i](n)
        }
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
