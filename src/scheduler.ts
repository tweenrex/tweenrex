import { Observable } from './Observable'

const raf =
    typeof window !== 'undefined'
        ? window.requestAnimationFrame
        : (fn: FrameRequestCallback) => setTimeout(() => fn(performance.now()), 1000 / 60)

export const scheduler = new Observable<number>()
scheduler.onSubscribe = function(): void {
    if (!this.subs.length) {
        raf(this.next)
    }
}
scheduler.onNext = function(): void {
    if (this.subs.length) {
        raf(this.next)
    }
}
