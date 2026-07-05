// Tiny Web Audio hover blips — synthesized, no audio files needed.
// Each nav item passes its index so the pitch rises down the menu.
let ctx: AudioContext | null = null;

export function blip(step = 0) {
  if (typeof window === "undefined") return;
  try {
    ctx ||= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = 440 * Math.pow(2, (step % 10) / 12); // rising chromatic steps
    osc.type = "triangle";
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch {
    // audio unavailable (autoplay policy, no device) — stay silent
  }
}
