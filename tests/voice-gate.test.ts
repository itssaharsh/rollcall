import { describe, expect, it } from 'vitest'
import { VoiceGate } from '../lib/agent/voice-gate'

const frame = (level: number) => Int16Array.from({ length: 480 }, (_, i) => (i % 2 ? level : -level))
const gate = () => new VoiceGate({ threshold: 150, frameMs: 20 })

describe('voice gate: audio goes out only around speech', () => {
  it('sends nothing during silence', () => {
    const g = gate()
    expect(Array.from({ length: 100 }, () => g.push(frame(0)).length).reduce((a, b) => a + b, 0)).toBe(0)
  })
  it('opens with 240ms of pre-roll so the first word is not clipped', () => {
    const g = gate()
    for (let i = 0; i < 50; i++) g.push(frame(0))
    expect(g.push(frame(3000)).length).toBe(13) // 12 pre-roll frames + the loud one
    expect(g.push(frame(3000)).length).toBe(1)
  })
  it('keeps sending a 1.5s silent tail, then closes', () => {
    const g = gate()
    g.push(frame(3000))
    const tail = Array.from({ length: 100 }, () => g.push(frame(0)).length)
    expect(tail.slice(0, 74).every((n) => n === 1)).toBe(true)
    expect(tail.slice(75).every((n) => n === 0)).toBe(true)
    expect(g.open).toBe(false)
  })
})
