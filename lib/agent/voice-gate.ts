// Send audio only around speech.
// Measured 2026-09-22 (scripts/drift-test.mts): fed a continuous real-time stream, the Voice Agent server falls about 6% behind,
// so speech is noticed 1.1s late at the start of a call and 4.7s late a minute in. Fed only speech plus a short silent tail,
// it catches up in the gaps and the delay stays at 1.1s. A pre-roll keeps word onsets; the tail lets turn detection see the silence.
export class VoiceGate {
  private preroll: Int16Array[] = []
  private quietMs = Infinity
  constructor(private opts: { threshold: number; frameMs: number; prerollMs?: number; tailMs?: number }) {}

  /** Returns the frames to send now: nothing while idle, the pre-roll plus this frame when speech starts, this frame while open. */
  push(frame: Int16Array): Int16Array[] {
    const { threshold, frameMs, prerollMs = 240, tailMs = 1500 } = this.opts
    let sum = 0
    for (let i = 0; i < frame.length; i += 4) sum += frame[i] * frame[i]
    const loud = Math.sqrt(sum / Math.ceil(frame.length / 4)) > threshold
    const wasOpen = this.quietMs < tailMs
    this.quietMs = loud ? 0 : this.quietMs + frameMs
    if (this.quietMs < tailMs) {
      if (wasOpen) return [frame]
      const out = [...this.preroll, frame]; this.preroll = []
      return out
    }
    this.preroll.push(frame)
    while (this.preroll.length * frameMs > prerollMs) this.preroll.shift()
    return []
  }
  get open() { return this.quietMs < (this.opts.tailMs ?? 1500) }
}
