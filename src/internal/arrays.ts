export function addAll<T>(target: T[], subarray: T[]): void {
  target.push.apply(target, subarray)
}

export function removeAll<T>(target: T[], subarray: T[]): void {
  for (let i = 0; i < subarray.length; i++) {
      const index = target.indexOf(subarray[i])
      if (index !== -1) {
          target.splice(index, 1)
      }
  }
}
