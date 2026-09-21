---
version: alpha
name: Rollcall — Register
description: >
  An attendance register, an office wall map and a six-line desk phone. Ledger-paper canvas,
  blue-black ink, one ballpoint-blue accent. Status is stamped, corrections are struck through,
  and every filled cell has an audio clip behind it.
colors:
  canvas: "#E8ECE6"
  surface-1: "#F4F6F2"
  surface-2: "#DCE2DA"
  line: "#BFC8BE"
  line-strong: "#8F9AA0"
  ink: "#111A2E"
  ink-muted: "#4C566B"
  accent: "#2438C9"
  accent-ink: "#FFFFFF"
  accent-soft: "#DDE1F0"
  success: "#1B6B42"
  warning: "#8A5200"
  danger: "#B3261E"
  lamp-ringing: "#F2A30F"
  lamp-connected: "#2FA56A"
  river: "#CBD8DC"
  park: "#D3E0CE"
typography:
  display:
    fontFamily: Instrument Sans
    fontStretch: 75%
    fontWeight: 700
    letterSpacing: -0.02em
    lineHeight: 1.1
  body:
    fontFamily: Instrument Sans
    fontStretch: 100%
    fontWeight: 400
    fontSize: 14px
    lineHeight: 1.5
  listing:
    fontFamily: Instrument Sans
    fontStretch: 85%
    fontWeight: 500
    fontSize: 13px
    lineHeight: 1.35
  mono:
    fontFamily: Martian Mono
    fontWeight: 400
    fontSize: 11px
    letterSpacing: 0em
  label:
    fontFamily: Martian Mono
    fontWeight: 600
    fontSize: 10px
    letterSpacing: 0.1em
    textTransform: uppercase
rounded:
  sm: 2px
  md: 4px
  lg: 6px
spacing:
  base: 4px
  group-tight: 8px
  group: 16px
  section: 32px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 0 16px
  button-primary-hover:
    backgroundColor: "#1E2FAE"
  button-primary-press:
    backgroundColor: "#182693"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
    height: 36px
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
    borderColor: "{colors.line-strong}"
  stamp-confirmed:
    textColor: "{colors.success}"
    borderColor: "{colors.success}"
    rounded: "{rounded.sm}"
  stamp-corrected:
    textColor: "{colors.warning}"
    borderColor: "{colors.warning}"
    rounded: "{rounded.sm}"
  stamp-ghost:
    textColor: "{colors.danger}"
    borderColor: "{colors.danger}"
    rounded: "{rounded.sm}"
  stamp-review:
    textColor: "{colors.accent}"
    borderColor: "{colors.accent}"
    rounded: "{rounded.sm}"
  stamp-retry:
    textColor: "{colors.ink-muted}"
    borderColor: "{colors.line-strong}"
    rounded: "{rounded.sm}"
  table-row:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.line}"
    height: 48px
  table-row-hover:
    backgroundColor: "{colors.surface-2}"
  line-card:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
---

## Overview

Rollcall phones every office in a health plan's provider directory and corrects the list. The
interface is the back office where that work happens: a **register** (the directory table), a
**wall map** with push pins, and a **six-line desk phone** (the switchboard). Nothing here is a
generic dashboard card. If a choice can't be explained by one of those three objects, cut it.

The one bold thing is the correction: the old value struck through in red pen, the new value written
next to it, and a play button that lets you hear the receptionist say it. Everything else is quiet.

## Colors

- **canvas `#E8ECE6`** — ledger paper. Page background only. Never pure white pages.
- **surface-1 `#F4F6F2`** — sheets that sit on the desk: table, map, line cards, drawers.
- **surface-2 `#DCE2DA`** — hover fill, skeleton blocks, the notice strip, idle lamps.
- **line `#BFC8BE`** — ruled lines and 1px borders. **line-strong `#8F9AA0`** — hover borders, map arterials.
- **ink `#111A2E`** — blue-black. All primary text. **ink-muted `#4C566B`** — secondary text, stale values.
- **accent `#2438C9`** — ballpoint blue. Allowed on: the one primary button per view, focus rings, the
  active tab indicator, text selection, links, and the *Needs a human* status. Never two primary
  buttons in one view. Never as a decorative fill. Budget: under 5% of pixels.
- **success `#1B6B42` / warning `#8A5200` / danger `#B3261E`** — outcomes only: confirmed, corrected,
  should-not-be-listed. They never decorate. Red appears only on a struck-through value, a ghost
  stamp, a ghost pin, or an error message.
- **lamp-ringing `#F2A30F` / lamp-connected `#2FA56A`** — fill-only. Line lamps and the live pin ring. Never text.
- **river / park** — map fills only.

Status is never colour alone: each outcome has its own glyph and pin shape (tick + circle, pencil +
diamond, cross + crossed ring, flag + triangle, redial + hollow ring).

## Typography

- **Instrument Sans**, one family, three widths. Display is condensed (`font-stretch: 75%`, 700) —
  it should read like a phone-directory heading. Listing text is `85%` so long practice names fit a
  row. Body copy is `100%`.
- **Martian Mono** for anything a machine or a stamp produced: phone numbers, times, durations,
  costs, grid references, tool calls, status stamps, line numbers. Labels are 10px / 600 / +0.1em / uppercase.
- Every number that changes or aligns uses `tabular-nums`.
- Scale (ratio 1.2): 11 · 12 · 13 · 14 · 16 · 20 · 24 · 32 · 44. Tally numerals are 44px display.
- At most one uppercase mono label per region. No eyebrow above headings.
- Sentence case everywhere except stamps and mono labels.

## Layout

- 4px base. Tight inside a group (4–8), generous between groups (16–32). The page gutter is 24px
  (16px under 640).
- The console is one screen tall at 1440×900: top bar 56, notice 32, tally 96, switchboard 116
  (40 when idle), tabs 40, then table (flex, min 760) beside the map (480).
- The table is the register: 48px rows, a 1px ruled line under every row, row numbers in a 44px
  margin column separated by a 1px line-strong rule.
- Components respond to their container (`@container`), not the viewport.

## Elevation & Depth

Flat paper. Sheets are surface-1 with a 1px line border and **no shadow**. Only things that float
above the desk get a shadow: drawers, the call sheet, tooltips, toasts. Shadows are two layers and
tinted with ink (`shadow-2`). No glass, no glows, no gradients on surfaces.

## Shapes

Radius is 2 (stamps, chips, table cells, pins' labels), 4 (buttons, inputs, line cards), 6 (drawers,
call sheet, map frame). Nothing is a pill except the line lamp, which is a circle. Borders are 1px.
The focus ring is 2px accent, offset 2px.

## Components

- **Primary button** — accent fill, white 600 label, h40, r4. One per view ("Answer a call" on the
  console; "Answer" inside the call sheet). Press: scale .97, 120ms.
- **Secondary button** — surface-1, 1px line, ink label, h36.
- **Status stamp** — mono 10px/600 uppercase, 1px border in the outcome colour, 12% tint of it as
  the fill, r2, h22. In the drawer and the report the stamp is large, rotated −4°, and lands with
  a 180ms scale 1.15→1.
- **Status mark** — 16px glyph in the row's margin column. It draws itself on (`pathLength` 0→1,
  300ms) at the moment the call ends.
- **Field cell** — stale: ink-muted. Asking: three-dot mono ellipsis. Confirmed: ink. Corrected: old
  value struck through with a 1px danger line in ink-muted, new value in ink 600, clip button always
  visible. Unconfirmed: value + accent "?" and a clip button.
- **Line card** — surface-1, r4. Lamp (10px circle): off = surface-2, dialing = lamp-ringing blinking
  in two hard steps at 1Hz, connected = lamp-connected steady. Caption is the last spoken line.
- **Map pin** — push pin. Shape and colour by outcome; drops 12px in 200ms when its call ends. The
  pin of an active call has a lamp-ringing ring.
- **Clip player** — 28px play button + mono time + the quote, where the word being spoken is inked
  and the rest is muted.
- **Drawer / call sheet** — surface-1, r6, shadow-2, scrim ink 40%.

## Do's and Don'ts

- Do show the old value next to the new one. A correction without its before is just a value.
- Do put a clip button on every cell a call filled in. If the audio is missing, say so; never hide the button.
- Do keep "Simulated offices — no real clinics were called" on screen at all times.
- Do use mono for anything a machine produced and sans for anything a person reads.
- Don't use the accent for decoration, icons, charts or stamps other than *Needs a human*.
- Don't use red for anything that isn't a removal, a ghost listing or an error.
- Don't add shadows to cards, gradient fills, glass, glows, pills, emoji, or a sparkle for "AI".
- Don't animate on load except the sweep itself. No fade-up on sections, no hover-scale on cards.
- Don't show a number that wasn't measured from the seed or a recorded session.
- Don't use real clinic names, real people or non-555-01xx phone numbers anywhere in the demo data.
