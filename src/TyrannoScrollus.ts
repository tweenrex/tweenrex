import { IScrollOptions, ITyrannoScrollus } from './types'
import { _ } from './internal/constants'
import { newify } from './internal/newify'
import { TRexObservable } from './Observable'
import { scheduler } from './scheduler'
import { resolveTarget } from './internal/resolveTarget';

export function TyrannoScrollus(options: IScrollOptions): ITyrannoScrollus {
    const self = TRexObservable<number, ITyrannoScrollus>(newify(this, TyrannoScrollus))
    self.target = resolveTarget(options.targets)
    self._scheduler = options.scheduler || scheduler
    self.tick = (options.direction === 'x' ? updateX : updateY).bind(self)
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
            self._sub = self._scheduler.subscribe(self.tick)
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
