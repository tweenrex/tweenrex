export function resolveTarget(target: string | Element): Element {
  return target instanceof Element ? target : document.querySelector(target)
}
