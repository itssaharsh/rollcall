# 4. No server sits in the visitor's call

**Decision.** The browser connects straight to AssemblyAI with a single-use token minted by `/api/token`. Tools run client-side through the gate. Vercel hosts the site; nothing holds a socket open.

**Why.** Lowest latency, one less thing to break, and Vercel functions cannot host WebSockets anyway. The key stays on the server; each token caps its session at 180 seconds; the account runs on prepaid credits, so the worst case is a drained balance and the call sheet falling back to the sample call.
