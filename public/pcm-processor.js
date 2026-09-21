// AudioWorklet: microphone → PCM16 mono at 24 kHz. The context runs at the device rate (Safari ignores a requested
// rate; Firefox loses echo cancellation on a non-default one), so resampling happens here.
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const { inputSampleRate, targetSampleRate } = options.processorOptions
    this.ratio = inputSampleRate / targetSampleRate
    this.pos = 0
  }
  process(inputs) {
    const input = inputs[0]?.[0]
    if (!input) return true
    const out = []
    // linear interpolation, carrying the fractional read position across blocks
    while (this.pos < input.length) {
      const i = Math.floor(this.pos), frac = this.pos - i
      const s = input[i] * (1 - frac) + (input[i + 1] ?? input[i]) * frac
      out.push(Math.max(-32768, Math.min(32767, Math.round(s * 32767))))
      this.pos += this.ratio
    }
    this.pos -= input.length
    if (out.length) { const pcm = Int16Array.from(out); this.port.postMessage(pcm.buffer, [pcm.buffer]) }
    return true
  }
}
registerProcessor('pcm-processor', PCMProcessor)
