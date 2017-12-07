import { TRexObservable } from '../packages/core/lib.es2015/TRexObservable'
import { TyrannoScrollus } from '../packages/core/lib.es2015/TyrannoScrollus'
import { TweenRex } from '../packages/core/lib.es2015/TweenRex'

// export to window
const global = window as any
global.TRexObservable = TRexObservable
global.TyrannoScrollus = TyrannoScrollus
global.TweenRex = TweenRex
