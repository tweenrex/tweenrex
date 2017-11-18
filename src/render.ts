import { interpolate } from '@tweenrex/render'

var global = window as any
var tweenrex = global.tweenrex || (global.tweenrex = {})
tweenrex.interpolate = interpolate
