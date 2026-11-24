// 用 jsdom 真正加载打包产物，验证 React 能挂载、DOM 有内容、无运行时报错
// 运行：node tests/dom.test.mjs
import { JSDOM, VirtualConsole } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve('dist/assets')
const jsFile = fs.readdirSync(distDir).find((f) => f.endsWith('.js'))
const code = fs.readFileSync(path.join(distDir, jsFile), 'utf8')

const errors = []
const vc = new VirtualConsole()
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + e.message))
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')))

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'http://127.0.0.1:5391/',
})
const { window } = dom

// 补齐 jsdom 缺失的浏览器 API（3D 场景在无 WebGL 时会自动跳过，不影响 UI 校验）
window.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [], onvoiceschanged: null }
window.SpeechSynthesisUtterance = class {}
window.AudioContext = class {
  constructor() { this.currentTime = 0; this.destination = {} }
  createOscillator() { return { type: '', frequency: {}, connect() { return this }, start() {}, stop() {} } }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this } } }
}
window.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') {
    return {
      createRadialGradient: () => ({ addColorStop() {} }),
      createLinearGradient: () => ({ addColorStop() {} }),
      fillRect() {}, fillStyle: '', globalAlpha: 1, beginPath() {}, arc() {}, fill() {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }), drawImage() {},
    }
  }
  return null // WebGL 不可用 → 场景层降级，UI 层仍需正常
}

try { window.eval(code) } catch (e) { errors.push("evalError: " + e.message) }
await new Promise(r => setTimeout(r, 600))

const root = window.document.getElementById('root')
const text = root.textContent || ''
const html = root.innerHTML

const checks = [
  ['React 已挂载（root 非空）', html.length > 500],
  ['渲染标题"太阳系的秘密"', text.includes('太阳系的秘密')],
  ['引导层出现"开始上课"', text.includes('开始上课')],
  ['四种立体模式文案齐全', ['视差立体', '红蓝眼镜', '左右分屏', '头部追踪'].every((m) => text.includes(m))],
  ['关卡地图三关齐全', ['认识八大行星', '行星离太阳有多远', '为什么有四季'].every((m) => text.includes(m))],
  ['教师端课堂报告入口存在', text.includes('课堂报告')],
  ['无严重运行时错误', errors.filter((e) => !/Not implemented|WebGL|getContext/.test(e)).length === 0],
]

let pass = 0
console.log('DOM 挂载与 UI 结构校验')
for (const [name, ok] of checks) {
  console.log(`  ${ok ? '✓' : '✗'} ${name}`)
  if (ok) pass++
}
if (errors.length) console.log('\n捕获到的非严重提示（预期：WebGL 不可用降级）:\n  ' + errors.slice(0, 4).join('\n  '))
console.log(`\n通过 ${pass}/${checks.length}`)
process.exit(pass === checks.length ? 0 : 1)
