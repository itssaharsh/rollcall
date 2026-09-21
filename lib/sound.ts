'use client'
// Two sounds, both synthesized: a phone ring for the incoming call and a stamp when the sweep completes.
const KEY = 'rollcall:muted'
let ctx: AudioContext | null = null
let ringTimer: ReturnType<typeof setInterval> | null = null

export const isMuted = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
export const setMuted = (m: boolean) => { try { localStorage.setItem(KEY, m ? '1' : '0') } catch {} ; if (m) stopRing() }

const audio = () => {
  if (isMuted()) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

function burst(ac: AudioContext, at: number) {
  // classic bell ring: two tones gated at 20Hz
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.12, at + 0.02)
  gain.gain.setValueAtTime(0.12, at + 0.9)
  gain.gain.linearRampToValueAtTime(0, at + 1)
  const trem = ac.createOscillator(); trem.frequency.value = 20
  const tremGain = ac.createGain(); tremGain.gain.value = 0.06
  trem.connect(tremGain).connect(gain.gain)
  for (const f of [440, 480]) {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f
    o.connect(gain); o.start(at); o.stop(at + 1)
  }
  trem.start(at); trem.stop(at + 1)
  gain.connect(ac.destination)
}

export function startRing() {
  const ac = audio(); if (!ac) return
  stopRing()
  burst(ac, ac.currentTime + 0.05)
  ringTimer = setInterval(() => { const a = audio(); if (a) burst(a, a.currentTime + 0.05) }, 2600)
}
export function stopRing() { if (ringTimer) clearInterval(ringTimer); ringTimer = null }

export function stamp() {
  const ac = audio(); if (!ac) return
  const at = ac.currentTime + 0.01
  const len = Math.floor(ac.sampleRate * 0.12)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = ac.createBufferSource(); src.buffer = buf
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380
  const g = ac.createGain(); g.gain.value = 0.5
  src.connect(lp).connect(g).connect(ac.destination); src.start(at)
  const thud = ac.createOscillator(); thud.frequency.setValueAtTime(110, at); thud.frequency.exponentialRampToValueAtTime(48, at + 0.12)
  const tg = ac.createGain(); tg.gain.setValueAtTime(0.3, at); tg.gain.exponentialRampToValueAtTime(0.001, at + 0.14)
  thud.connect(tg).connect(ac.destination); thud.start(at); thud.stop(at + 0.15)
}
