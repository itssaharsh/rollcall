// node qa.mjs http://localhost:3210 [filter]  — screenshots every route × width × state into qa/
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] ?? 'http://localhost:3210'
const only = process.argv[3]
const shots = [
  ['landing', '/'],
  ['console-before', '/console?state=before'], ['console-running', '/console?state=running'], ['console-done', '/console?state=done'],
  ['console-loading', '/console?state=loading'], ['console-error', '/console?state=error'], ['console-empty', '/console?state=empty'],
  ['map', '/console?state=done&pane=map'], ['drawer-corrected', '/console?listing=L-017'], ['drawer-ghost', '/console?listing=L-014'], ['drawer-review', '/console?listing=L-009'],
  ['review', '/console?tab=review'], ['report-tab', '/console?tab=report'],
  ...['invite', 'unavailable', 'permission', 'ringing', 'connected', 'wrap', 'done', 'mic-denied', 'quota', 'dropped'].map((s) => [`call-${s}`, `/console?call=1&state=${s}`]),
  ['report', '/report'], ['about', '/about'], ['kit', '/_kit'], ['404', '/nope'],
].filter(([name]) => !only || name.includes(only))
const widths = [390, 1024, 1440]

// use the cached Chromium; never download one
const cache = join(homedir(), '.cache/ms-playwright')
const dir = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop()
const executablePath = [join(cache, dir, 'chrome-linux/chrome'), join(cache, dir, 'chrome-linux64/chrome')].find(existsSync)

mkdirSync('qa', { recursive: true })
const browser = await chromium.launch({ executablePath })
const errors = []
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : w === 1024 ? 768 : 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && errors.push(`${w} ${page.url()} :: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`${w} ${page.url()} :: ${e.message}`))
  for (const [name, path] of shots) {
    await page.goto(base + path, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }) // the dev-only Next.js badge
    await page.waitForTimeout(900)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    if (overflow > 0) errors.push(`${w} ${path} :: horizontal overflow ${overflow}px`)
    await page.screenshot({ path: `qa/${name}-${w}.png`, fullPage: !path.includes('call=') && !path.includes('listing=') })
  }
  await ctx.close()
}
await browser.close()
console.log(errors.length ? errors.join('\n') : 'no console errors, no horizontal overflow')
