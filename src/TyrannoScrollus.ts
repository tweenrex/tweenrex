import { IScrollOptions, ITyrannoScrollus } from './types'
import { _ } from './internal/constants'
import { newify } from './internal/newify'
import { TRexObservable } from './TRexObservable'
import { defaultTimer } from './internal/defaultTimer'
import { resolveTarget } from './internal/resolveTarget'

/**
 * Creates a TyrannoScrollus instance.  This allows tweening based on changes to the x or y scroll position of an element.
 */
export function TyrannoScrollus(options: IScrollOptions): ITyrannoScrollus {
    const self = newify<ITyrannoScrollus>(this, TyrannoScrollus)

    self.target = resolveTarget(options.targets)
    self._timer = options.timer || defaultTimer
    self.easing = options.easing

    self._tick = () => {
        const target = self.target
        // prettier-ignore
        let value = self.direction === 'x'
                ? target.scrollLeft / (target.scrollWidth - target.clientWidth)
                : target.scrollTop / (target.scrollHeight - target.clientHeight)

        // ease value if specified
        if (self.easing) {
            value = self.easing(value)
        }

        // publish next value
        self.next(value)
    }

    // copy next/subscribe to this object
    const obs = TRexObservable<number>(options)
    self.dispose = () => {
        // pause timeline to clear active state
        self.pause()

        // clear state
        self.target = _

        // dispose the observable
        obs.dispose()
    }
    self.next = obs.next
    self.subscribe = obs.subscribe

    return self
}

TyrannoScrollus.prototype = {
    get isPlaying(this: ITyrannoScrollus): boolean {
        return !!this._sub
    },
    play(this: ITyrannoScrollus): void {
        const self = this
        if (!self.isPlaying) {
            self._sub = self._timer.subscribe(self._tick)
        }
    },
    pause(this: ITyrannoScrollus): void {
        const self = this
        if (self.isPlaying) {
            self._sub()
            self._sub = _
        }
    }
}
