# lablab submission kit

**Title:** Rollcall

**Short description (≤ 255 chars):**
A voice agent that phones every doctor's office in a health plan's directory, fixes the list, and keeps the audio clip behind every change. It refuses to write down a guess. Built on the AssemblyAI Voice Agent API.

**Long description:**
Health plans must verify every provider listing every 90 days (No Surprises Act; the REAL Health Providers Act makes it proactive from 2028). Today that is a call centre asking the same questions, and directories are still wrong: US Senate staff called 120 listings and could book an appointment at 18% of them.

Rollcall makes those calls. One click starts a sweep: six lines dial forty simulated offices through the AssemblyAI Voice Agent API. Each call discloses that it is automated, checks five facts in three questions, and records each clear answer with one JSON-schema tool call. The register fills itself: confirmed cells get a tick, corrected cells show the old value struck through beside the new one, ghost listings are flagged for removal, and every cell plays the receptionist's own words when you click it.

What makes it different is a write gate in code, not in the prompt. A value reaches the directory only if the office's words support it: numbers in a new address must have been heard, "I think so?" is refused and sent to a person, a confirmation cannot overwrite a correction or contradict what was said. Refusals go back to the agent as tool errors that tell it what to ask next. Scored against hidden truth sheets, the recorded sweep got 40 of 40 outcomes and 150 of 150 written fields right with 0 false writes, at about $0.08 per listing.

Then it is your turn: press Answer a call and play the front desk in your browser. Be vague, change the suite number, interrupt it. What you say becomes row 41.

AssemblyAI features used: Voice Agent API on both ends of every recorded call and in the browser, per-call key terms and transcription prompt built from the row being verified, function tools in hold and interactive modes, tool errors as recovery instructions, temporary tokens, reply.create, adaptive turn detection replaced by fixed thresholds where agents talk to agents, and voice-gated input.

Every office is simulated. No real clinic was called.

**Technology tags:** AssemblyAI, Voice Agent API, Next.js, Vercel, TypeScript
**Category tags:** Healthcare, Voice, Agents, Operations

**Links:** demo https://rollcall-sage.vercel.app · repo https://github.com/itssaharsh/rollcall · slides `docs/submission/slides.pdf` · cover `docs/submission/cover.png`

## How lablab scores (read from lablab.ai/hackathon-rules on 2026-09-22)

Each criterion is 1 to 5. What the top scores ask for, in lablab's words:

- **Presentation (pdf and video):** 4 = "communicates the problem, solution, and value proposition in less than 5 min. Explain market analysis and marketing revenue. Explain future goals & plans." 5 adds "competitive analysis". A video under 3 minutes is described at the low end. So: **3:30 to 4:30, and say the market, the revenue model, the competition and the plan out loud** (slides 9 to 11).
- **Application of technology:** 4 = "Demo video is shown with all features tried. Demo link is working… Github code is available & well thought off." So the video must show every feature being used, not described.
- **Business value:** 4 = "clear market potential… Strong market feasibility and scalability." 5 = "clear sustainable revenue generation".
- **Originality:** 4 = "innovative idea employing unconventional methods". Lead with the gate that refuses to guess and the clip behind every cell.

## Video: done

`docs/submission/rollcall-demo.mp4` (4:24, 1080p30, −14 LUFS, captions burned in; `rollcall-demo.srt` alongside). Built from the live site with a synthesised narrator (Kokoro, voice af_heart); the phone-call audio in it is the real recorded calls from `public/calls/`. Thumbnail: `video-thumbnail.png`. Script: `video-script.md`. To re-render: the storyboard is `video-storyboard.json` (needs the `product-demo-video` kit in `video/`).

Upload to YouTube as unlisted, paste the link in the lablab form. If you would rather voice it yourself, read `video-script.md` over the same footage.

## Video plan (the version above follows this)

| Time | Screen | Say |
|---|---|---|
| 0:00 | black card | "Call ten therapists from your insurer's list. Eight are ghosts." |
| 0:10 | the landing page, the three numbers | "By law, plans re-check every listing every 90 days. That's a call centre." |
| 0:18 | `/console?state=before` → Start sweep | "Rollcall makes the calls. Six lines, forty offices." |
| 0:45 | click the struck cell on row 7 | "Every change has a clip. That's the receptionist." (let the audio play) |
| 1:05 | Needs a human → row 9 | "She said 'I think so'. It refused to write that down." |
| 1:25 | row 38 transcript, red refused row | "This gate is code, not prompt. Here it refused the model twice." |
| 1:40 | Answer a call, live | play the front desk: change the suite, hedge on new patients |
| 2:25 | row 41, then /report | "What I said is now row 41, and the plan files this report." |
| 2:40 | slide 7 | "Forty of forty outcomes, no false writes, eight cents a listing." |
| 2:55 | slide 9 | who pays: plan data teams, mandated every 90 days; $2.76B a year already spent by practices; several dollars a manual call against eight cents |
| 3:20 | slide 10 | call centres, enterprise vendors, and what is different: audio behind every value, a gate that refuses guesses, a public score |
| 3:40 | slide 11 | next: real phone lines, a pilot with one plan, the 2028 audits |
| 4:00 | URL | "rollcall-sage.vercel.app. Go be the front desk." |

Record at 1920×1080, captions on, product on screen by 0:18. Show every feature being used: sweep, clip from a cell, review queue, refused row, live call, report.
