# 3. The console is a pure function of sweep time

**Decision.** `lib/sweep-engine.ts` derives every row, cell, line card, pin and tally number from one clock value `t`. No component keeps sweep state.

**Why.** It makes the replay deterministic, lets `?t=` and `?state=` freeze any moment for screenshots and QA, and means recorded calls drop in by replacing data, not code.
