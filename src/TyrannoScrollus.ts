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
    self._tick = (options.direction === 'x' ? updateX : updateY).bind(self)

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

function updateX(this: ITyrannoScrollus): void {
    const self = this
    const target = self.target
    self.next(target.scrollLeft / (target.scrollWidth - target.clientWidth))
}

function updateY(this: ITyrannoScrollus): void {
    const self = this
    const target = self.target
    self.next(target.scrollTop / (target.scrollHeight - target.clientHeight))
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
