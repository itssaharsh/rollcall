# 2. The sweep is recorded; the visitor's call is live

**Decision.** The 40-call sweep is recorded once through a two-agent bridge (`scripts/record-sweep.mts`) and replayed from `seed/demo.json` at 8×. The visitor's own call runs live, browser to AssemblyAI.

**Why.** A judge clicks alone. A replay is identical every time and costs nothing per page load; 40 live calls per visit would cost about $6 and could fail in front of them. The live call is where they test the agent themselves, so that is where the credits go. The screen says "recorded sweep" at all times.
