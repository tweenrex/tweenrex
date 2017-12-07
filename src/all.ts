import { TRexObservable } from '../packages/core/lib.es2015/TRexObservable'
import { TyrannoScrollus } from '../packages/core/lib.es2015/TyrannoScrollus'
import { TweenRex } from '../packages/core/lib.es2015/TweenRex'
import { interpolate } from '../packages/render/lib.es2015/interpolate'
import { transform } from '../packages/render/lib.es2015/transform'

const w = window as any
w.TRexObservable = TRexObservable
w.TyrannoScrollus = TyrannoScrollus
w.TweenRex = TweenRex

const t = w.tweenrex || (w.tweenrex = {})
t.interpolate = interpolate
t.transform = transform
