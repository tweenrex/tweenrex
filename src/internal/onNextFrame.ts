export const onNextFrame =
    typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (fn: FrameRequestCallback): any => setTimeout(() => fn(Date.now()), 1000 / 60)
