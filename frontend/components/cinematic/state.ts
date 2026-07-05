// Mutable bridge between the GSAP ScrollTrigger layer and the canvas
// scrubber. Written every scroll tick, read in a rAF loop — no React
// re-renders on the hot path.
export const introState = {
  progress: 0, // 0..1 through the pinned scroll story
};
