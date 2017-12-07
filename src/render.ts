import { interpolate } from '../packages/render/lib.es2015/interpolate'
import { transform } from '../packages/render/lib.es2015/transform'

const w = window as any
const tweenrex = w.tweenrex || (w.tweenrex = {})
tweenrex.interpolate = interpolate
tweenrex.transform = transform
