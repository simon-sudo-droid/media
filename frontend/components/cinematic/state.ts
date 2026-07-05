// Mutable bridge between the DOM scroll layer (GSAP ScrollTrigger) and the
// R3F scene. Written every scroll/pointer tick, read in useFrame — no React
// re-renders on the hot path.
export const introState = {
  progress: 0,   // 0..1 through the pinned scroll story
  px: 0,         // pointer x, -1..1
  py: 0,         // pointer y, -1..1
  focus: -1,     // finale hotspot index (-1 = free)
};
