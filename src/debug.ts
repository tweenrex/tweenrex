import { player, visualize } from '../packages/debug/lib/index.js'

const w = window as any
const tweenrex = w.tweenrex || (w.tweenrex = {})
tweenrex.debug = {
    player,
    visualize
}
