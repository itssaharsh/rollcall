// Renders the raster brand assets from the live dev server: OG image, apple icon, favicon.
// node scripts/brand.mjs http://localhost:3210
import { chromium } from 'playwright'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] ?? 'http://localhost:3210'
const cache = join(homedir(), '.cache/ms-playwright')
const dir = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop()
const executablePath = [join(cache, dir, 'chrome-linux/chrome'), join(cache, dir, 'chrome-linux64/chrome')].find(existsSync)
const browser = await chromium.launch({ executablePath })

const og = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await og.goto(base + '/_og', { waitUntil: 'networkidle' })
await og.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
await og.waitForTimeout(500)
await og.screenshot({ path: 'app/opengraph-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
await og.screenshot({ path: 'brand/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } })

const mark = readFileSync('brand/mark.svg', 'utf8').replace(/<style>.*?<\/style>/s, '<style>.i{stroke:#111A2E}.a{stroke:#2438C9}</style>')
const icon = async (size, pad, path, bg = '#E8ECE6') => {
  const p = await browser.newPage({ viewport: { width: size, height: size } })
  await p.setContent(`<body style="margin:0;background:${bg};display:grid;place-items:center;width:${size}px;height:${size}px"><div style="width:${size - pad * 2}px;height:${size - pad * 2}px">${mark.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`)
  const buf = await p.screenshot({ path, omitBackground: bg === 'transparent' })
  await p.close(); return buf
}
await icon(180, 22, 'app/apple-icon.png')
await icon(512, 72, 'public/icon-512.png')
await icon(192, 26, 'public/icon-192.png')
const png32 = await icon(32, 2, 'brand/favicon-32.png', 'transparent') // ICO needs an RGBA PNG
// a PNG wrapped in an ICO container
const head = Buffer.alloc(22)
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4)
head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9)
head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png32.length, 14); head.writeUInt32LE(22, 18)
writeFileSync('app/favicon.ico', Buffer.concat([head, png32]))
await browser.close()
console.log('brand assets written')
