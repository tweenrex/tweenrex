import { _ } from './constants'

export function inherit<T1, T2>(a: T1, b: T2): T1 & T2 {
    for (let k in b) {
        if (a[k as string] === _) {
            a[k as string] = b[k]
        }
    }
    return a as T1 & T2
}
