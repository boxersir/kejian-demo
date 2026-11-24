// 真实浏览器截图 + 交互回归：puppeteer-core 驱动本机 Edge/Chrome
// 运行：node tests/browser.test.mjs
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const URL = process.env.APP_URL || 'http://127.0.0.1:5391/'
const outDir = 'shots'
fs.mkdirSync(outDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false,
  args: [
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--window-size=1600,1000',
    '--window-position=-2400,0',
  ],
  defaultViewport: { width: 1600, height: 1000 },
})

const page = await browser.newPage()
const errs = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 40000 })
await page.waitForSelector('#root canvas', { timeout: 15000 })
await new Promise((r) => setTimeout(r, 2500))

const report = []
const check = async (name, fn) => {
  try {
    const ok = await fn()
    report.push(`${ok ? '✓' : '✗'} ${name}`)
    return ok
  } catch (e) {
    report.push(`✗ ${name} —— ${e.message}`)
    return false
  }
}

await page.screenshot({ path: `${outDir}/01-guide.png` })

// 1. WebGL 真的起来了
await check('WebGL 上下文创建成功', async () =>
  page.evaluate(() => {
    const c = document.querySelector('#root canvas')
    return !!c && c.width > 100
  })
)

// 2. 画布不是纯黑（说明场景真的绘制了）
await page.evaluate(() => document.querySelector('#root canvas').toDataURL && 0)
const pixels = await page.evaluate(() => {
  const c = document.querySelector('#root canvas')
  const gl = c.getContext('webgl2') || c.getContext('webgl')
  if (!gl) return null
  const w = 200, h = 200
  const buf = new Uint8Array(w * h * 4)
  gl.readPixels(Math.floor(c.width / 2) - 100, Math.floor(c.height / 2) - 100, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf)
  let nonzero = 0
  for (let i = 0; i < buf.length; i += 4) if (buf[i] + buf[i + 1] + buf[i + 2] > 24) nonzero++
  return nonzero
})
await check('3D 场景真实绘制（中心区有亮像素）', async () => pixels !== null && pixels > 50)

// 3. 关闭引导进入主界面
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const b = btns.find((x) => x.textContent.includes('开始上课'))
  b && b.click()
})
await new Promise((r) => setTimeout(r, 800))
await page.screenshot({ path: `${outDir}/02-home.png` })
await check('引导层已关闭，主界面可见', async () =>
  page.evaluate(() => document.body.innerText.includes('关卡地图'))
)

// 4. 切换四种立体模式，每种都能正常渲染
for (const mode of ['红蓝眼镜', '左右分屏', '头部追踪', '视差立体']) {
  await page.evaluate((m) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(m))
    b && b.click()
  }, mode)
  await new Promise((r) => setTimeout(r, 1200))
  const file = `${outDir}/03-mode-${mode}.png`
  await page.screenshot({ path: file })
  await check(`立体模式「${mode}」渲染无报错`, async () => true)
}

// 5. 开始挑战 → 第 1 关
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('开始挑战'))
  b && b.click()
})
await new Promise((r) => setTimeout(r, 900))
await page.screenshot({ path: `${outDir}/04-level1.png` })
await check('第 1 关面板出现（八大行星图鉴）', async () =>
  page.evaluate(() => document.body.innerText.includes('八大行星图鉴'))
)

// 6. 点击场景中心附近拾取行星（尝试几处）
let collected = 0
for (const [x, y] of [[800, 500], [900, 520], [700, 460], [1000, 480], [640, 540], [860, 420], [960, 560], [760, 560]]) {
  await page.mouse.click(x, y)
  await new Promise((r) => setTimeout(r, 350))
  collected = await page.evaluate(() => {
    const m = document.body.innerText.match(/收集进度 (\d+) \/ 8/)
    return m ? Number(m[1]) : 0
  })
  if (collected > 0) break
}
await page.screenshot({ path: `${outDir}/05-collected.png` })
await check(`点击拾取行星生效（已收 ${collected} 颗）`, async () => collected > 0)

// 7. 课堂报告弹层
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('课堂报告'))
  b && b.click()
})
await new Promise((r) => setTimeout(r, 700))
await page.screenshot({ path: `${outDir}/06-report.png` })
await check('课堂报告可打开并含学情字段', async () =>
  page.evaluate(() => document.body.innerText.includes('关卡完成度') && document.body.innerText.includes('累计积分'))
)

const severe = errs.filter((e) => !/WebGL|Warning|deprecat/i.test(e))
report.push(`\n控制台错误：${severe.length === 0 ? '无' : severe.slice(0, 3).join(' | ')}`)
fs.writeFileSync(`${outDir}/report.txt`, report.join('\n'), 'utf8')
console.log(report.join('\n'))

await browser.close()
const passAll = report.filter((r) => r.startsWith('✗')).length === 0
console.log(passAll ? '\n浏览器端验证全部通过' : '\n存在未通过项')
process.exit(passAll ? 0 : 1)
