// Builds the submission kit from the running app: slides.pdf, cover.png, and a GIF of the sweep for the README.
// node scripts/kit.mjs http://localhost:3210
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = process.argv[2] ?? 'http://localhost:3210'
const cache = join(homedir(), '.cache/ms-playwright')
const dir = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop()
const executablePath = [join(cache, dir, 'chrome-linux/chrome'), join(cache, dir, 'chrome-linux64/chrome')].find(existsSync)
mkdirSync('docs/submission', { recursive: true }); mkdirSync('docs/media', { recursive: true })
const browser = await chromium.launch({ executablePath })

const deck = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await deck.goto(base + '/_slides', { waitUntil: 'networkidle' })
await deck.addStyleTag({ content: 'nextjs-portal{display:none!important} @page{size:1920px 1080px;margin:0}' })
await deck.waitForTimeout(800)
await deck.pdf({ path: 'docs/submission/slides.pdf', width: '1920px', height: '1080px', printBackground: true })
await deck.screenshot({ path: 'docs/submission/cover.png', clip: { x: 0, y: 0, width: 1920, height: 1080 } })

const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: 'docs/media/_video', size: { width: 1280, height: 800 } } })
const page = await ctx.newPage()
await page.goto(base + '/console', { waitUntil: 'domcontentloaded' })
await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
await page.waitForTimeout(16000)
await ctx.close(); await browser.close()
const webm = join('docs/media/_video', readdirSync('docs/media/_video')[0])
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.5', '-t', '12', '-i', webm, '-vf', 'fps=9,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', 'docs/media/sweep.gif'])
rmSync('docs/media/_video', { recursive: true, force: true })
console.log('kit written: docs/submission/slides.pdf, docs/submission/cover.png, docs/media/sweep.gif')
