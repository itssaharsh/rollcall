// node qa-flow.mjs http://localhost:3210 — drives the demo path a judge takes and asserts each step
import { chromium } from 'playwright'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] ?? 'http://localhost:3210'
const cache = join(homedir(), '.cache/ms-playwright')
const dir = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop()
const executablePath = [join(cache, dir, 'chrome-linux/chrome'), join(cache, dir, 'chrome-linux64/chrome')].find(existsSync)
const browser = await chromium.launch({ executablePath })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
const ok = (name, pass, extra = '') => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!pass) process.exitCode = 1 }
const text = (sel) => page.locator(sel).first().innerText()

await page.goto(base + '/?state=before', { waitUntil: 'networkidle' })
ok('the register starts stale', (await text('header button')).includes('Start sweep') && (await text('section[aria-label="Sweep tally"]')).includes('0/40'))
await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
ok('sweep autoplays without a click', (await text('header button')).includes('Sweeping'))
const lamps = await page.locator('section[aria-label="Phone lines"] button').count()
ok('six line cards while sweeping', lamps === 6, `${lamps}`)
const t0 = Date.now()
await page.waitForFunction(() => document.querySelector('header button')?.textContent?.includes('Replay sweep'), null, { timeout: 90000 })
ok('sweep completes', true, `${((Date.now() - t0) / 1000 + 2.5).toFixed(0)}s wall`)
ok('register reads 40/40', (await text('section[aria-label="Sweep tally"]')).includes('40/40'))

// signature: a struck cell → drawer → clip steps through the quote
for (let i = 1; i <= 3; i++) {
  await page.locator('[role=row]:has-text("Lucía Ferreira") [aria-label="Play the clip for address"] >> visible=true').first().click()
  await page.waitForSelector('dialog.drawer[open]')
  await page.waitForTimeout(700)
  const playing = await page.locator('dialog.drawer [aria-label="Pause the clip"]').count()
  ok(`signature clip plays from the cell (run ${i})`, playing >= 1)
  await page.keyboard.press('Escape'); await page.waitForTimeout(500)
}
ok('drawer closes on Esc', (await page.locator('dialog.drawer[open]').count()) === 0)

// review queue: resolve one, undo exists
await page.getByRole('tab', { name: /Needs a human/ }).click()
await page.getByRole('button', { name: 'Schedule callback' }).first().click()
await page.waitForTimeout(600)
ok('resolving a review card updates the tab count', (await page.getByRole('tab', { name: /Needs a human/ }).innerText()).includes('2'))

// the call: sample path end to end
await page.keyboard.press('Escape')
await page.getByRole('tab', { name: /Directory/ }).click()
await page.keyboard.press('a')
await page.waitForSelector('dialog.sheet[open]')
await page.getByRole('button', { name: 'Watch a sample call' }).click()
await page.waitForFunction(() => document.querySelector('dialog.sheet')?.textContent?.includes('Added as row'), null, { timeout: 90000 })
ok('sample call ends with a new row', true)
await page.getByRole('button', { name: 'See it in the directory' }).click()
await page.waitForSelector('dialog.drawer[open]')
ok('row 41 opens in the drawer', (await text('dialog.drawer')).includes('Salome Reyes'))
await page.keyboard.press('Escape')
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800)
ok('refresh lands on the finished sweep', (await text('header button')).includes('Replay sweep'))
ok('row 41 survives a refresh', (await text('section[aria-label="Directory"]')).includes('Salome Reyes') || (await text('section[aria-label="Sweep tally"]')).includes('41/41'))
await page.keyboard.press('Control+Shift+R'); await page.waitForTimeout(600)
ok('reset shortcut clears the demo', (await text('section[aria-label="Sweep tally"]')).includes('0/40'))

// reduced motion: lands on done, no autoplay
const calm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await calm.goto(base + '/', { waitUntil: 'networkidle' }); await calm.waitForTimeout(1800)
ok('reduced motion skips the replay', (await calm.locator('header button').first().innerText()).includes('Replay sweep'))

console.log(errors.length ? 'console errors:\n' + errors.join('\n') : 'no console errors')
await browser.close()
