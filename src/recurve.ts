import * as easing from '../packages/recurve/lib.es2015/index'

const w = window as any
const t = w.tweenrex || (w.tweenrex = {})
t.easing = easing
