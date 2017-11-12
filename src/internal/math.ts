export function minMax(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}
