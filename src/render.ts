import { interpolate } from '@tweenrex/render'

const global = window as any
const tweenrex = global.tweenrex || (global.tweenrex = {})
tweenrex.interpolate = interpolate
