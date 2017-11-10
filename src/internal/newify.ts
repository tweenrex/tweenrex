export function newify<T>(self: T, type: Function): T {
    return self instanceof type ? self : Object.create(type.prototype)
}
