import { player, visualize } from '@tweenrex/debug'

const window2 = window as any
const tweenrex = window2.tweenrex || (window2.tweenrex = {})
tweenrex.debug = {
    player,
    visualize
}
