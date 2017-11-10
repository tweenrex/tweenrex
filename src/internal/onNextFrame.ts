export const onNextFrame =
    typeof window !== 'undefined'
        ? requestAnimationFrame
        : (fn: FrameRequestCallback): any => setTimeout(() => fn(Date.now()), 1000 / 60)
