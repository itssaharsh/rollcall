# Plan to submission

Deadline: **Wed 30 Sep 2026, 15:00 UTC (20:30 IST)**. Submit on the 29th. The 30th is buffer only.

## When the key arrives (about 30 minutes)

1. Put `ASSEMBLYAI_API_KEY=...` in `.env.local` (git-ignored). Confirm the $100 shows in the AssemblyAI dashboard.
2. `npm run check:keys`. Five checks, a few cents:

| Check | If it fails |
|---|---|
| 1. key mints a token | wrong key, or Voice Agent API not enabled on the account: ask in the lablab Discord |
| 2. a session speaks and ends | read the `session.error` code; fix `scripts/lib/aai.ts` against the events reference |
| 3. twelve sessions at once | record with `--lines 1` or `2`; the replay still shows six lines |
| 4. two agents hold a call through the bridge | listen to `recordings/bridge-test.wav`. Talking over each other → raise the office's `min_silence`; long silences → lower it. If it cannot be made natural in two hours, play the ten front-desk types yourself into the caller agent and record those |
| 5. Sessions API returns artifacts | not needed: the bridge records its own audio |

3. `npm run dev`, open the console, **Answer a call**. This is the first real run of `lib/agent/assembly-driver.ts`. Go off-script: hedge, change the address, say nothing for five seconds, interrupt it.
4. `npm run record -- --only L-014 --lines 1`, listen, then `npm run record`, `npm run import:recordings`, `npm run eval`.

If the Voice Agent API itself is unusable on the account, the brief also allows Realtime STT with your own LLM and TTS; the gate, tools, seed and UI carry over unchanged.

## Status, Tue 22 Sep

Key checks: all five pass. Two real calls recorded, imported and scored (`npm run eval`: 5/5 written fields right, 0 false writes). Three platform findings fixed along the way, written up in `docs/adr/0005`: send audio only around speech, three questions instead of five, no `max_accuracy`. Credits spent on this debugging: roughly $2 to $3.

Still untested by a person: the live browser call. Restart `npm run dev` so it picks up `.env.local`, then **Answer a call**.

## Status, Tue 22 Sep, evening

The full sweep is recorded, imported and scored: **40 of 40 outcomes right, 150 of 150 written fields correct, 0 false writes**, 5 tool calls refused by the gate, average call 62s, $0.077 per listing. All 40 rows on the console now play real audio. Four model mistakes were found in the recordings and closed in code, each with a test built from the real call: a confirm overwriting a correction (L-010), a confirm contradicting the office (L-026), a hedge split across utterances (L-009), digits given before a read-back (L-038). L-010, L-026 and L-038 were re-recorded after their fixes; the other 37 are first takes. Live call: cap is now 150s, records at the end, and the cap saves the row; needs another try by a person. Credits used so far: about $14 of $100.

## Status, Tue 22 Sep, late

Second live test by Saharsh: fine apart from one bug, now fixed. A changed suite ("suite 4 instead of 3") was sent to a human because the unchanged street number was never spoken; only numbers that differ from the file must now be heard. Hedge list widened ("almost", "kind of", "should be", "pretty sure"…). `npm run rehearse -- "<behaviour>"` rehearses a live call against a simulated front desk; `tests/replay.test.ts` replays all 40 recordings through the gate on every test run. 120 tests pass.

## Days

| Date | Work | Done when |
|---|---|---|
| Mon 21 | UI, engine, gate, driver, scripts (done, demo mode) | `npm run verify` and `npm run qa:flow` pass |
| Tue 22 | Key checks, first live call, first recorded call | you have heard the agent refuse a hedge out loud |
| Wed 23 | Record all 40, import, eval; tune the prompt on the misses, re-record those | `npm run eval` prints PASS, 0 false writes |
| Thu 24 | Deploy to Vercel (`vercel`, set the key, test logged-out in incognito); audio to `public/calls` or S3 | a stranger's laptop can take a call from the URL |
| Fri 25 | Live-call polish: latency, dead air, barge-in, mobile Safari; budget caps | three off-script calls in a row end with a correct row 41 |
| Sat 26 | **Feature freeze.** Outsider test with one front-desk or payer person. Fix only what they tripped on | — |
| Sun 27 | **UI freeze.** README GIFs (scripted with Playwright), about page numbers, cover image | — |
| Mon 28 | Video: script, record at 1920×1080, voice it yourself, captions. Slides (≤10 words each) | 3:00 or less, aha by 0:45 |
| Tue 29 | **Submit.** Every lablab field, tags, links tested in incognito | confirmation email |
| Wed 30 | Buffer | — |

## Video beats (≤3:00)

0:00 "Call ten therapists from your insurer's list. Eight are ghosts." → 0:12 the 90-day law, one line → 0:18 Start sweep: lamps, captions, cells, pins → 0:45 **click the struck-through cell, hear the clip** → 1:05 "I think he's still taking patients?" → refused → human queue → 1:25 Tony's Pizza: nothing written → 1:40 Answer a call, go off-script, row 41 → 2:20 how it's built on AssemblyAI: key terms from the row, tools, the gate as code → 2:40 the number from `npm run eval` and cost per listing → 2:50 URL.

## Scope cuts, agreed in advance

1. The Report page and CSV. 2. The live three-call sweep on AWS. 3. Twilio phone number. 4. Mobile layout polish beyond "works". Cut from the top if a day slips. Never cut: the recorded sweep, the clip from a cell, the refusal, the live call.

## Not done yet

- Nothing key-dependent has run: the live driver, the bridge, the recorder.
- Commits: the repo is initialised but nothing is committed. Commit daily from today; small commits read as real work.
- 60fps check at 4× CPU throttle, and watching the video on a phone.
