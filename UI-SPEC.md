---
name: Rollcall
design: ./DESIGN.md
direction: "derived: Register — attendance register + office wall map + six-line desk phone"
personality: precise
dials: { variance: 4, motion: 4, density: 7 }
stack: { next: 16.3, react: 19.3, tailwind: 4.3, ui: "bespoke components (no shadcn)", motion: 13, toast: sonner, numbers: "@number-flow/react", icons: "@phosphor-icons/react regular + 6 custom glyphs" }
archetype: dashboard-monitoring + voice call sheet   # blueprints (b) + (f)
viewports: [390x844, 1024x768, 1440x900]
signature: "A corrected cell shows the old value struck through beside the new one; clicking it plays the receptionist saying it while the quote inks in word by word and the pin pulses on the map."
demo: { seed: ./seed/demo.json, flag: "?demo=1 (default on until keys exist)", state_param: "?state=", time_param: "?t=<sweep seconds>", reset: "mod+shift+r", guest: true }
deviations:
  - "No shadcn/Base UI: every component is bespoke to the register look and there are no complex primitives beyond a dialog; native <dialog> + CSS covers it."
  - "No 3D: the hero object is a table and a wall map. 3D would be atmosphere only."
  - "No cmdk palette: four actions total, each has a visible button and a single-key shortcut."
  - "Map is a hand-drawn SVG of a fictional county, not MapLibre: no keys, no tile loads in front of a judge, and no fake clinic lands on a real address."
  - "Added C-27 CallLog under the map (audit trail, newest first). It fills the space a fixed-aspect map leaves on tall screens and hides itself when the side column is under 530px."
  - "Custom breakpoint `wide` (1400px) because Tailwind 4 sorts arbitrary min-[] variants before named ones, which let `sm:`/`lg:` rules win."
  - "Added S0 Landing at `/` (blueprint j) on 2026-09-22; the console moved to `/console`. Judges are not healthcare people: the landing says what this is in two sentences while the real console runs the recorded sweep live in the hero (iframe of `/console?embed=1`, looping, never marks the session as seen). Old `/?state=…` links redirect."
  - "Console height is max(100dvh, 960px) at lg+: on a 900px screen the page scrolls 60px rather than squeezing the map."
---

## 0. Idea brief

- **User and moment:** a provider-data analyst at a health plan, at a desk, 1440-wide monitor, running the quarterly directory check. The judge is a second user: alone, from a link, laptop, maybe a phone.
- **Core loop verb:** *sweep* — call every listing, fill the register.
- **Hero object:** the directory listing (a row), and the area map it sits on.
- **World inventory:** attendance register with pen ticks · office wall map with push pins · six-line desk phone with line lamps · date stamp ("VERIFIED 21 SEP") · phone directory set in condensed type.
- **Moving data:** line lamps blink and captions scroll, cells fill, marks draw on, pins drop, tally numbers tick, the 40-box register strip colours in.
- **Wow moment:** click a struck-through cell → hear "Dr. Alvarez retired last spring" while the words ink in and the pin pulses. Second: the judge's own voice becomes row 41.
- **Artifact:** the sweep report (printable attestation + corrections CSV).
- **Judging:** lablab, async. Four criteria, no weights published (assume 25% each): Application of Technology, Presentation, Business Value, Originality. Judges see a ≤3 min video, then click the URL alone. No UI prize, so one strong console beats many routes.
- **Budget:** ~2 days of UI inside a 9-day build. Deadline 2026-09-30 15:00 UTC.

### Direction candidates

| | Direction | Fits the world | Projector / video | Differs from the day | Buildable | Total |
|---|---|---|---|---|---|---|
| A | Klein Blueprint, mutated (green-grey canvas, condensed display, 2·4·6 radius) | 4 | 5 | 4 | 5 | 18 |
| B | Sodium Night (dark, amber routes) | 3 | 4 | 2 | 4 | 13 |
| **C** | **Register (derived)** | 5 | 5 | 5 | 4 | **19** |

C wins. A and C share blue ink; C adds the register, the lamps and the strike-through, which is where the identity lives.

## 1. Demo script (≤3:00)

| Time | On screen |
|---|---|
| 0:00 | Voice over a black card: "Call ten therapists from your insurer's list. Eight are ghosts." One line on the 90-day law. |
| 0:12 | Console, `?state=before`: 40 listings, all "verified 400+ days ago", tally at zero. |
| 0:18 | Click **Start sweep**. Six lamps blink, captions run, cells fill, pins drop, register strip colours in. |
| 0:55 | Sweep ends. Stamp lands on the tally: 17 · 11 · 8 · 3 · 1. |
| 1:00 | Click the struck-through cell on row 14 → clip plays, quote inks in, pin pulses. **Signature moment.** |
| 1:20 | Open *Needs a human*: "I think he's still taking some patients?" → agent refused to confirm. Click **Keep as listed**… no: **Schedule callback**. |
| 1:40 | Row 22: "Tony's Pizza" → wrong number flagged, nothing written. |
| 1:50 | **Answer a call.** Play the front desk, go off-script. Fields fill as heard. Row 41 appears. |
| 2:30 | Report: corrections file + attestation sheet. Cost per listing. |
| 2:45 | How it's built on AssemblyAI (about page), then the URL. |

## 2. Screen inventory

| id | route | purpose | entered from | primary action | states |
|---|---|---|---|---|---|
| S0 | `/` | Landing: what it is, live console in the hero, three figures, two real clips, how it works, the score | link | Watch it make 40 calls | static + live embed |
| S1 | `/console` | Sweep console: tally, switchboard, register, map | link | Answer a call | before · running · done · loading · error · empty |
| S1a | `/` tab `review` | Needs-a-human queue | tab, tally block | Resolve a card | list · empty · resolving |
| S1b | `/` tab `report` | Report preview | tab | Download corrections | ready · empty (sweep not run) |
| S2 | `/?listing=L-014` | Listing drawer over S1 | row, pin, tally strip box | Play clip | default · playing · no-audio · stale (not called yet) · live (in call) |
| S3 | `/?call=1` | Call sheet over S1 | Answer a call | Answer | invite · permission · ringing · connected(agent/listening/thinking) · wrap · done · mic-denied · unavailable · quota · dropped · capped |
| S4 | `/report` | Printable sweep report | report tab | Print / download | ready · empty |
| S5 | `/about` | Problem, law, how it's built, what was measured | top bar | Open the console | static |
| S6 | `/_kit` | Every component in every state; logo candidates; type scale | direct | — | — |
| S7 | 404 | Designed not-found | bad URL | Back to the console | — |

## 3. Flow map

```
S1(before) --Start sweep / autoplay 1.2s--> S1(running) --last call ends--> S1(done)
S1(done) --Replay sweep (R)--> S1(running)
S1(*) --click row | pin | strip box--> S2 --Esc | scrim | close--> S1
S2 --click field--> S2(playing clip) --ended--> S2
S1 --Answer a call (A)--> S3(invite) --Answer--> S3(permission) --granted--> S3(ringing) --pick up--> S3(connected)
S3(connected) --agent ends | Hang up | 150s cap--> S3(wrap) --results written--> S3(done) --See it in the directory--> S1 (row 41 selected)
S3(permission) --denied--> S3(mic-denied) --Watch a sample call--> S3(connected, simulated)
S3(invite, no token) --> S3(unavailable) --Watch a sample call--> S3(connected, simulated)
S1 tab review --resolve--> card exits, tally updates, toast with Undo (6s)
S1 tab report --Open full report--> S4 ;  S4 --Download corrections--> CSV
any --mod+shift+r--> clears session + local rows, returns to S1(before)
```

## 4. Screens

### S1 Console (blueprint b) — 1440×900

Page: canvas, padding 24, vertical gap 16. One screen tall; only the table body scrolls.

| Region | Size | Contents, in reading order |
|---|---|---|
| TopBar | h56, full width, surface-1, 1px line bottom | Logo lockup · 1px divider · plan context "Cascadia Health Plan · Behavioral health · 40 listings" · spacer · SweepButton (C-04) · AnswerCallButton (C-14) · sound IconButton · About link |
| NoticeStrip | h32, surface-2 | mono label: "Simulated offices — no real clinics were called" · right: "Recorded sweep, replayed at 8×" |
| Tally | h96 | five TallyBlocks (C-03) · RegisterStrip (C-03b, 40 boxes) · sweep meta line |
| Switchboard | h116 running / h40 idle | six LineCards (C-06), gap 8 |
| TabsRow | h40 | Tabs (C-19): Directory 40 · Needs a human 3 · Report — right side: FilterBar (C-25) |
| Body | fills rest, min-h 420 | DirectoryTable (C-07) flex · side column w480 (w360 under 1400): AreaMap (C-10) at its natural height, then CallLog (C-27) filling the rest |

- **First 10 seconds:** first visit lands in `before` for 1.2s (stale register, grey pins), then the recorded sweep plays on its own. Refresh within the session lands in `done`. Reduced motion lands in `done`.
- **Data:** everything from `seed/demo.json` through the sweep engine (`lib/sweep-engine.ts`): UI state is a pure function of sweep time `t`. Row 41+ comes from the judge's calls (localStorage now, API later).
- **1024–1399:** side column narrows to 360; the register drops to five columns (address moves under the practice name, phone lives in the drawer).
- **390:** single column. Tally is a 3×2 grid; RegisterStrip full width below it. Switchboard becomes a horizontal scroll-snap row of 260px cards. Body gets a List | Map segmented control; rows become two-line cards (h72). AnswerCallButton is a sticky bottom bar h56 with 16 inset above the safe area.

### S2 Listing drawer

Right drawer, w480 (full width under 640), surface-1, r6 on the left corners, shadow-2, scrim ink 40%. Enters with the drawer curve, 450ms.

1. Header h72: provider name (display 20), practice · district · grid ref, close IconButton. Large StatusStamp top right, rotated −4°.
2. **Listing** — five FieldRows: label · listed value → result value · ClipButton. Corrected rows show the strike-through.
3. **Call** — meta line in mono: "Line 3 · 0:52 · answered by a person · $0.07". ClipPlayer for the whole call. Transcript: turns with speaker labels (Rollcall / Office); tool calls inline as mono rows (`confirm_field  address`). Clicking a FieldRow scrolls to and plays its quote.
4. **Human gate** (review outcome only): reason + three buttons (same as ReviewCard).

### S3 Call sheet (blueprint f)

Centered `<dialog>`, 760×540 (full screen under 640), two columns:

- Left 420 — **the line**: lamp + state label ("Ringing", "Rollcall is speaking", "Listening", "Thinking"), VoiceBars (C-16), captions (last 3 turns + live partial), control bar h56: Mute · Hang up · timer (mono, counts to 2:30).
- Right 340 — **your office**: briefing card ("You're the front desk at Juniper Row Counseling…"), suggestion chips (not buttons: "It's all correct", "She left in March", "Not taking new patients", "Put me on hold", "Wrong number"), then the five capture fields that fill as heard (C-17).

Done state replaces the left column with the result: stamp, fields captured, "Added as row 41", buttons **See it in the directory** (primary) and **Call again**.

### S4 Report

A4-proportioned sheet (max-w 840) on canvas. Header with logo, plan, date, large stamp "SWEEP COMPLETE". Summary numbers. Table of corrections (listing · field · was · now · quote · clip time). Ghost listings. Needs-a-human list. Method note ("Simulated offices…"). Attestation lines. Buttons (hidden in print): Download corrections (CSV) · Print.

### S5 About

Max-w 720 reading column. Four sections: the problem (with the Senate numbers and source links) · the 90-day rule · how a call works (inline SVG diagram: row → key terms → call → tool calls → cell + clip → human review) · what is and isn't measured yet.

## 5. Components

### C-01 TopBar (custom)
Purpose: says what this is and holds the two actions.
Placement: S1 top, sticky top:0, z 30. Size: h56, px24, gap 16. Tokens: bg surface-1, 1px line bottom.
States: default only. Under 640: plan context hidden, SweepButton becomes an IconButton.
Keyboard: `R` replay, `A` answer a call, `M` mute, `/` focus search, `Esc` close overlay. No animation on key-triggered actions.

### C-03 TallyBlock ×5 (custom) + C-03b RegisterStrip
Purpose: the running count of outcomes.
Placement: S1 Tally, five equal blocks (min-w 132), gap 0 with 1px line dividers; RegisterStrip right, w 360.
Size: h96, p 12/16. Numeral: display 44 tabular. Label: mono label 10. Glyph 16 left of label.
Tokens: bg surface-1; numeral ink (ink-muted while 0); glyph in outcome colour.
States: zero (ink-muted "0") · counting (NumberFlow tick) · final · selected (acts as a filter: 2px bottom border in outcome colour) · hover (surface-2, clickable).
Transitions: zero -CALL_DONE-> counting -SWEEP_DONE-> final ; any -CLICK-> selected (filters table) -CLICK-> unselected.
RegisterStrip: 40 boxes 14×14, gap 3, two rows of 20. Box states: stale (1px line) · live (lamp-ringing fill, hard blink) · outcome (fill in outcome colour at 100%, glyph omitted at this size; tooltip has the name and outcome). Click opens S2. Below it, mono 11 meta: "Sweep 5:38 recorded · avg call 0:49 · $0.06 per listing".
Copy: "Accurate as listed" · "Corrected" · "Shouldn't be listed" · "Needs a human" · "Retry scheduled".
A11y: each block is a `button[aria-pressed]`; polite live region announces "Sweep complete. 17 accurate, 11 corrected, 8 shouldn't be listed, 3 need a human, 1 retry."
Acceptance: `?state=before|running|done`.

### C-04 SweepButton (Button secondary)
Purpose: start or replay the sweep.
Placement: TopBar right, before the primary. Size h36, px12, icon 16.
States: before "Start sweep" (play glyph) · running "Sweeping… 23/40" (count from engine, width locked, `aria-busy`, click = skip to end) · done "Replay sweep" · disabled while S3 is connected (tooltip "Finish the call first").
Transitions: before -CLICK|AUTOPLAY-> running -END|CLICK-> done -CLICK|R-> running.
Motion: morphing label (crossfade 180ms, width animates).

### C-05 Switchboard + C-06 LineCard ×6 (custom)
Purpose: show the six calls in flight.
Placement: S1 below Tally. Grid 6 cols, gap 8. Collapses to a 40px bar ("6 lines idle · last sweep 40 calls") when no line is active; expands on sweep start (layout spring .3/.1).
LineCard size: h116, p 12. Row 1: lamp 10px + "LINE 3" mono label + timer mono 11 right. Row 2: practice name (listing 13/600, one line, ellipsis). Row 3: caption (body 12, two lines, ink-muted; speaker prefix "Office:" in ink). Row 4: VoiceBars 16px tall.
States: idle (lamp off, "Idle", no caption) · dialing (lamp-ringing hard blink 1Hz, "Dialing (564) 555-0117…") · connected (lamp-connected steady, caption updates) · hold ("On hold", bars flat, lamp steady) · voicemail ("Voicemail — hanging up") · ended (outcome stamp shows 900ms, then next call or idle).
Transitions: idle -ASSIGN-> dialing -ANSWER-> connected -END-> ended -NEXT-> dialing | idle.
Click: opens S2 for that listing (live state). Hover: surface-2.
Reduced motion: no blink, no bars animation.
Acceptance: kit renders all six states.

### C-07 DirectoryTable + C-08 ListingRow + FieldCell (custom)
Purpose: the register. One row per listing; cells fill as calls report.
Placement: S1 Body left. Sticky header h36 on surface-1 (mono labels). Rows h48, 1px line bottom, surface-1.
Columns: margin 44 (row no. mono 11 muted + StatusMark) | Provider 1fr min 220 (name listing 13/600 + credential muted; second line practice · grid ref mono 10) | Address 200 | Phone 124 mono | New patients 96 | In network 88 | Result 132 (StatusStamp) .
Row states: stale ("Verified 412 days ago" in Result, ink-muted values) · queued (same, row no. in ink) · live (left 2px lamp-ringing rule, Result shows "Line 3 · 0:21") · done (mark drawn, stamp, cells resolved) · selected (accent-soft bg, 2px accent left rule) · hover (surface-2) · new (row 41+: enters with y8→0, blur 4→0, 300ms; "Your call" tag).
FieldCell states: stale · asking (mono "···" pulsing opacity) · confirmed (ink) · corrected (old struck through + new 600 + ClipButton visible) · unconfirmed (value + accent "?" + ClipButton) · not-asked ("—").
ClipButton: 20px icon button, play glyph; visible on row hover for confirmed cells, always for corrected/unconfirmed. Click opens S2 and plays that quote. `aria-label="Play the clip for address"`.
Keyboard: rows are focusable (`tabindex 0`), Enter opens S2, ↑/↓ move focus (no animation).
Empty: filter returns nothing → EmptyState "No listings match 'fernhill'. Clear the filter."
Loading: 8 skeleton rows in the row's own layout. Error: "Couldn't load the directory. Reload the page." + Reload button.
Acceptance: `?state=loading|error|empty`.

### C-09 StatusStamp + StatusMark (custom)
Stamp: mono 10/600 uppercase +0.1em, h22, px8, r2, 1px outcome border, 12% outcome tint. Text: "CONFIRMED" · "CORRECTED ·2" (count of fields) · "REMOVE" · "NEEDS A HUMAN" · "RETRY 2PM". Large variant (drawer, report): h40, 14px, rotate −4°, lands scale 1.15→1 in 180ms with one stamp sound (if sound on).
Mark: 16px custom glyph (g-tick, g-pencil, g-cross, g-flag, g-redial), stroke 2, round caps, outcome colour; draws on with pathLength 0→1, 300ms ease-out.

### C-10 AreaMap + C-11 MapPin (custom SVG)
Purpose: where the listings are, and which are ghosts.
Placement: S1 Body right, w480, fills height, surface-1, 1px line, r6, overflow hidden. viewBox 1000×760.
Layers: park fills → river → minor road grid (line, 1px) → arterials (line-strong, 2px) → district labels (mono 10 uppercase, ink-muted at 70%) → index grid A–F / 1–5 (mono 10, edge ticks) → pins. Legend bottom-left: five pin shapes with labels.
Pin states: stale (r4 hollow, line-strong) · live (r5 lamp-ringing ring, two-step pulse) · confirmed (circle, success) · corrected (diamond, warning) · ghost (crossed ring, danger) · review (triangle, accent) · retry (hollow ring, ink-muted) · hover (label tooltip: name, outcome) · selected (2px ink ring + label pinned; map does not pan).
Transitions: stale -CALL_START-> live -CALL_END-> outcome (drop 12px, 200ms ease-out-quint; T-03).
Keyboard: pins are buttons in DOM order of row number; Enter opens S2.
Under 640: map is its own tab, h 60vh.

### C-12 ListingDrawer (native dialog)
See S2. States: default · playing (active quote inked) · no-audio · stale ("Not called yet. Start the sweep.") · live (transcript streams; fields fill).
Focus: trapped; returns to the row or pin that opened it. Esc closes. URL gets `?listing=`.

### C-13 ClipPlayer (custom)
Purpose: prove a value with the office's own words.
Size: h44 row: play/pause IconButton 28 · mono time "0:31–0:37" · quote text (body 14). Whole-call variant adds a 4px scrub bar.
States: idle · playing (words ink in: spoken = ink, upcoming = ink-muted; button shows pause) · ended (returns to idle) · no-audio (button enabled; plays the word timing silently; caption "Audio arrives with the recorded sweep") · error ("Couldn't play this clip. Try again.").
Motion: none except word colour change (150ms). Only one clip plays at a time app-wide.
A11y: `aria-live="off"`; the quote is always readable as text.

### C-14 AnswerCallButton (Button primary)
Purpose: the judge's turn.
Placement: TopBar far right; under 640 a sticky bottom bar.
Size: h40, px16, phone glyph 18. Label "Answer a call".
States: idle · hover (accent-hover 150ms) · press (scale .97) · focus-visible · attention (after the sweep ends: one 600ms lamp-ringing ring around the button, once) · disabled while the sweep is in its first 3s (tooltip "Starting the sweep…").
Keyboard: `A`.

### C-15 CallSheet (native dialog) + C-16 VoiceBars + C-17 CaptureFields
State machine in §7. Per-state copy in §8.
VoiceBars: 24 bars, 3px wide, gap 2, h40; height from the analyser (live) or from scripted levels (simulated). Agent speaking = ink bars; office speaking = accent bars; listening = bars at 2px with a slow idle; thinking = three mono dots.
CaptureFields: five rows (label · value). States: waiting ("—") · heard (value flies in from the caption: T-07) · corrected (strike + new) · unconfirmed ("?"). 
Controls: Mute (toggle, `aria-pressed`) · Hang up (destructive ghost; label "Hang up") · timer.

### C-18 ReviewQueue + ReviewCard (custom)
Purpose: the human gate. The agent never writes a value it couldn't confirm.
Card: surface-1, 1px line, r4, p16. Header: provider · practice · StatusStamp. Reason line: "Couldn't confirm: accepting new patients." Quote (body 16) with the hedge words highlighted (accent-soft bg). ClipPlayer. Actions: **Keep as listed** (secondary) · **Apply change…** (secondary; opens inline field picker) · **Schedule callback** (secondary). 
States: default · resolving (buttons lock, spinner leads) · resolved (card exits: opacity 0, scale .96, 150ms; list closes up with layout spring) · empty ("Nothing needs a human. Every answer was clear enough to write down.").
Toast: "Callback scheduled for Tue 2:00 PM" with Undo (6s).

### C-19 Tabs
h40; items h32 px12; label body 14/500 + count in mono 11. Active: ink + 2px accent underline that slides (layoutId, spring .25/.15). Inactive: ink-muted; hover ink + surface-2. Arrow keys move, no animation on key.

### C-20 ReportSheet
See S4. Empty: "Run the sweep first. The report is written from its results."

### C-21 Toast (sonner, re-tokened)
ink bg, canvas text, r4, bottom-right, 4s. One toast per task, updated in place.

### C-22 Tooltip
ink bg, canvas text, mono 11, r2, 500ms first open then instant; opens on focus.

### C-23 EmptyState / ErrorState
Glyph 24 (direction glyph: g-register) + title 16/600 + one sentence + one action. Centered in its region.

### C-27 CallLog (custom)
Purpose: the audit trail. Every finished call, newest first, with its result.
Placement: S1 side column under the map, flex-1. Header h36 (label + "23 ended"). Rows h30: mono end time · StatusMark · provider · reason.
States: empty ("No calls yet. Each finished call lands here with its result.") · filling (rows appear as calls end) · full (scrolls). Hidden when the side column is shorter than 530px. Click opens S2.

### C-25 FilterBar
Search input h32 w220 (placeholder "Search name, practice, district") + five outcome chips (toggle, h28, r2). Active chip: outcome tint + border. `/` focuses search.

### C-26 IconButton, Kbd, Skeleton
Per DESIGN.md and skill defaults. Icon buttons 32 square (44 touch), `aria-label`, tooltip shows shortcut.

## 6. Choreography

| id | trigger | from → to | what moves | pattern | timing |
|---|---|---|---|---|---|
| T-01 | sweep starts | Switchboard idle → running | bar 40 → 116; six cards appear | layout | spring .3 / .1; cards stagger 40ms |
| T-02 | field answered | FieldCell asking → confirmed/corrected | value crossfades in; on corrected the strike line draws left→right | crossfade + draw-on | 180ms; strike 240ms ease-out |
| T-03 | call ends | row live → done; pin live → outcome; strip box fills; tally ticks | StatusMark draws on; stamp fades in; pin drops 12px; NumberFlow tick | draw-on | mark 300ms; pin 200ms ease-out-quint; all within 60ms of each other |
| T-04 | sweep ends | Tally running → final | large stamp "SWEEP COMPLETE" lands on the meta line; AnswerCallButton gets one attention ring | stamp | 180ms scale 1.15→1; ring 600ms once |
| T-05 | click corrected cell | row → drawer + clip | drawer slides in; quote words ink in with the audio; map pin pulses (scale 1→1.25→1) | drawer + link highlight | 450ms drawer curve; pulse 240ms |
| T-06 | Answer a call | button → call sheet | dialog rises 8px + scale .96→1 | modal | 280ms in / 150ms out |
| T-07 | field heard in live call | caption → capture field | the heard phrase is highlighted in the caption, then the value appears in its field | crossfade (no flying clone under reduced motion) | 200ms highlight, 180ms value |
| T-08 | call done | sheet → console | sheet closes; row 41 enters (y8→0, blur 4→0); table scrolls it into view; its pin drops | list add | 300ms |
| T-09 | review resolved | card → gone | card exits; list closes; tally ticks | list remove | exit 150ms; layout spring .3/0 |

Frequency gate: keyboard shortcuts, row focus moves and filter typing do not animate. Hover ≤150ms. Reduced motion keeps colour/opacity changes and drops all movement, blinking and bars.

## 7. State machines

**Sweep engine** (`lib/sweep-engine.ts`): `mode ∈ before | running | done`; clock `t` in recorded seconds, advanced by rAF × speed (8). Every listing's UI state is derived: `phase(listing, t) ∈ stale | queued | dialing | live | done`; a field is resolved when `t ≥ call.startAt + field.at`; caption = last turn with `t0 ≤ t − startAt`. Events: START, TICK, SKIP (jump to end), RESET. `?state=` and `?t=` set the clock and pause it. The tab being hidden pauses the clock.

**Call sheet**
```
invite --ANSWER--> permission --GRANTED--> ringing --PICKUP(auto 1.8s)--> connected
permission --DENIED--> mic-denied --WATCH_SAMPLE--> connected(simulated)
invite --NO_TOKEN--> unavailable --WATCH_SAMPLE--> connected(simulated)
invite --BUDGET_SPENT--> quota --WATCH_SAMPLE--> connected(simulated)
connected: substate agent-speaking | listening | thinking   (from driver events)
connected --AGENT_END | HANGUP--> wrap --RESULTS_WRITTEN(≤2s)--> done
connected --CAP_150S--> capped --> wrap
connected --SOCKET_LOST--> dropped --CALL_AGAIN--> permission
done --SEE_ROW--> closed (row 41 selected) ; done --CALL_AGAIN--> ringing
any --ESC--> confirm if connected ("Hang up and close?") else closed
```
Driver interface (`lib/call-driver.ts`): `start()`, `stop()`, `setMuted()`, events `state`, `turn`, `partial`, `level`, `field`, `end`, `error`. `SimulatedDriver` ships now; `AssemblyDriver` arrives with the keys and must emit the same events.

**Clip player:** `idle --PLAY--> playing --END|PAUSE--> idle`; starting any clip stops the one playing.

## 8. Copy deck

| Where | Copy |
|---|---|
| Notice | Simulated offices — no real clinics were called · Recorded sweep, replayed at 8× |
| Plan context | Cascadia Health Plan · Behavioral health · 40 listings |
| Sweep button | Start sweep · Sweeping… 23/40 · Replay sweep |
| Primary | Answer a call |
| Tally | Accurate as listed · Corrected · Shouldn't be listed · Needs a human · Retry scheduled |
| Stale result | Stale · 412d (title: Last verified 412 days ago) |
| Stamps | CONFIRMED · CORRECTED ·2 · REMOVE · NEEDS A HUMAN · RETRY 2PM |
| Ghost reasons | Provider retired · Left the practice · Wrong number · Number disconnected · Doesn't take this plan |
| Review reasons | Couldn't confirm: accepting new patients · Two different answers about the address · Asked to call the office manager |
| Clip, no audio | Audio arrives with the recorded sweep |
| Call invite title | Your turn: be the front desk |
| Call invite body | Rollcall will call you about one listing. Answer however you like — be helpful, be vague, put it on hold. What you say becomes row 41. |
| Call invite button | Answer · Watch a sample call |
| Permission | Allow the microphone to pick up. Nothing is recorded outside this call. |
| Mic denied | The microphone is blocked. Allow it from the address bar, or watch a sample call. |
| Unavailable | Live calls are switched off in this preview. Watch a sample call instead. |
| Quota | Today's live-call budget is used up. Watch a recorded call instead. |
| Dropped | The line dropped and nothing was saved. Call again? |
| Capped | Calls are capped at two and a half minutes in this demo. Wrapping up. |
| Call states | Ringing… · Rollcall is speaking · Listening · Thinking |
| Call done | Added as row 41 · See it in the directory · Call again |
| Review empty | Nothing needs a human. Every answer was clear enough to write down. |
| Review actions | Keep as listed · Apply change… · Schedule callback |
| Report buttons | Download corrections (CSV) · Print |
| Table empty | No listings match “{q}”. Clear the filter. |
| Table error | Couldn't load the directory. Reload the page. |
| 404 | This listing isn't in the directory. · Back to the console |

## 9. Brand

- **Concept:** the register tick. Three candidates rendered in `/_kit` at 16/32/128: (1) monogram **R** whose leg is a tick, (2) a register row — rounded square with a tick and two ruled lines, (3) a push-pin head with the tick cut out. **Chosen: (1)** — it holds at 16px and is the only one that's a letter.
- **Wordmark:** "Rollcall" in Instrument Sans 75% width, 700, −0.02em. Lockup: mark 1.3× cap height, gap 0.5× mark width.
- **Custom glyphs (24 grid, 2px stroke, round):** g-tick, g-pencil, g-cross, g-flag, g-redial, g-register. Generic verbs come from Phosphor Regular.
- **Files:** `brand/mark.svg`, `brand/lockup.svg`, `brand/glyphs.svg`, `brand/og.png`; `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png`, `theme-color #E8ECE6`.

## 10. Don'ts (project-specific)

- No real clinic, person, NPI or phone number outside 555-01xx. The county and the plan are fictional.
- No number on screen that isn't computed from the seed or a recorded session. No "96% accuracy" until `npm run eval` prints it.
- The agent's voice never appears as a chat bubble UI. It's a phone line: captions under a lamp.
- No orb. The voice indicator is bars on a line card, because this world has phones, not assistants.
- The notice strip never hides, including in the call sheet and the report.
- Red is never used for the brand, the CTA or emphasis.
- The map never pans or zooms on its own.

## 11. Acceptance

- `/` first visit: register visibly stale, then the sweep plays without a click; refresh lands on the finished sweep.
- `?state=before|running|done|loading|error|empty` each render at 390, 1024 and 1440 with no horizontal scroll.
- `?listing=L-014` opens the drawer on a corrected listing; clicking its struck cell plays (or silently steps through) the quote; works three times in a row.
- `?call=1&state=invite|permission|ringing|connected|wrap|done|mic-denied|unavailable|quota|dropped` render.
- A simulated call ends with row 41 in the table and on the map, and it survives a refresh. `mod+shift+r` removes it.
- Keyboard: Tab reaches every control with a visible ring; `R`, `A`, `M`, `/`, `Esc` work; drawer and sheet trap focus and return it.
- Reduced motion: no blinking, no bars, no drops; state changes still visible.
- Contrast AA on canvas, surface-1 and surface-2 (checked: ink 13.2–16.0, muted 5.6–6.8, accent 6.4–7.8, signals ≥4.85).
- Anti-slop grep returns nothing: no indigo/violet, no `bg-clip-text`, no `backdrop-blur`, no `transition-all`, no emoji.

### QA record (2026-09-21)
- `node qa.mjs` — 27 views × 3 widths: no console errors, no horizontal overflow.
- `node qa-flow.mjs` — 16/16: autoplay, 40/40 in 45s wall, signature clip ×3, Esc, review resolve, sample call → row 41 → refresh → reset, reduced motion.
- `npx @google/design.md lint DESIGN.md` — 0 errors (20 orphaned-token warnings: tokens used by CSS, not by front-matter components).
- `next build` — all routes static.
- Not yet verified: real audio clips (arrive with the recorded sweep), the live AssemblyAI driver, 60fps at 4× CPU throttle, the phone-sized video check.
