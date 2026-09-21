# 5. Audio is sent only around speech

**Finding (2026-09-22, `scripts/drift-test.mts`).** Fed a continuous real-time audio stream, the Voice Agent server falls about 6% behind: the same 3-second clip is noticed 1.1s after onset at t=2s and 4.7s after onset at t=60s. Chunk size (20ms vs 100ms), digital silence vs faint noise, and the client's socket backlog (none) make no difference. In a two-agent call the delay compounded on both legs: turn-end detection went from 1.0s to 5.0s within 75 seconds, and a five-question call could not finish in 110s.

**Update, same evening.** The drift is intermittent: +3.5s per minute at about 10:00 UTC, +1.2s at 18:45, and gone (0 to +0.2s) at 19:00 to 19:10 with the same script. The gate stays: it is free when the drift is absent and removes it when present.

**Decision.** `lib/agent/voice-gate.ts` forwards audio only while someone is speaking, with 240ms of pre-roll and a 1.5s silent tail so turn detection still sees the silence. The server catches up in the gaps. With the gate, the delay at t=60s equals the delay at t=2s, and turn-end detection stays at 0.8 to 1.8s for the whole call. The recorder and the live browser driver both use it.

**Also measured the same day.** A tool call costs a second model pass (2 to 3s before the next question is audible), so the call asks three questions instead of five and one `confirm_fields` call can cover two fields. Recorded calls run tools in `hold` mode (about a second faster per answer); live calls use `interactive` mode with a spoken "Got it." so a person never hears dead air. `transcription_mode: max_accuracy` added 2.4s of end-of-turn wait per answer; key terms carry the accuracy instead. `end_call` gets no `tool.result`, because a result fires one more reply after the goodbye.

