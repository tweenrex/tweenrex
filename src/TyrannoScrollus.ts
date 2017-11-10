import { IScrollOptions, ITyrannoScrollus } from './types'
import { _ } from './internal/constants'
import { newify } from './internal/newify';
import { TRexObservable } from './Observable'
import { scheduler } from './scheduler'

export function TyrannoScrollus(options: IScrollOptions): ITyrannoScrollus {
    const self = TRexObservable<number, ITyrannoScrollus>(newify(this, TyrannoScrollus))
    self.target = options.targets instanceof Element ? options.targets : document.querySelector(options.targets)
    self._scheduler = options.scheduler || scheduler
    self.tick = () => {
        const target = self.target
        self.next(target.scrollTop / (target.scrollHeight - target.clientHeight))
    }
    return self
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
