# 6. Live calls record at the end; recorded calls record as they go

**Finding (2026-09-22).** With a tool call after every answer, a visitor's call ran past the 90-second cap: each tool call is a second model pass, 2 to 3 seconds of silence before the next question. Rehearsed through the bridge in live mode, the agent instead said "Got it.", kept asking, and recorded all five fields once at the end: 74 seconds, no dead air between questions.

**Decision.** Live mode is told to do exactly that. Recorded mode still records after each answer, because the console replay is better when a row's cells resolve one by one. Both go through the same gate.

**What this required of the gate.** Evidence can no longer be "the last thing the office said". The gate keeps the call as exchanges (the agent's question, the office's reply) and judges each field against the reply to the question that was about that field (`answerTo`). A hedge in the address answer blocks only the address. Also from the recordings: a confirmation never overwrites a correction (`mergeWrite`), and a "correction" to the value already on file is a confirmation.

**Cap.** 150 seconds in the UI, 180 on the token. At 125 seconds the agent is asked to finish. At the cap, and on Hang up, the call ends properly and whatever was captured becomes the row; before this fix the sheet stayed on "Writing results…" and saved nothing.
