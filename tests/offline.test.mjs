// 离线单文件版冒烟测试：把 offline/index.html 的内联脚本注入 jsdom，确认脱离服务器也能启动
// 运行：node tests/offline.test.mjs
import { JSDOM, VirtualConsole } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve('offline/index.html')
const html = fs.readFileSync(file, 'utf8')
const size = fs.statSync(file).size

const errors = []
const vc = new VirtualConsole()
vc.on('jsdomError', (e) => errors.push(e.message))

// runScripts: 'outside-only' 后手动 eval 内联脚本 —— jsdom 对 file:// 页面不会自动执行
const dom = new JSDOM(html, {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: 'http://127.0.0.1:5391/',
  beforeParse(window) {
    window.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [] }
    window.SpeechSynthesisUtterance = class {}
    window.HTMLCanvasElement.prototype.getContext = () => null // 无 WebGL，测降级路径
  },
})

const { window } = dom
const inline = [...window.document.querySelectorAll('script')].map((s) => s.textContent).join('\n')
window.eval(inline)
await new Promise((r) => setTimeout(r, 1000))

const root = window.document.getElementById('root')
const text = root.textContent || ''
const inner = root.innerHTML

const checks = [
  ['单文件体积 < 1.2MB（U 盘/离线可发）', size < 1.2 * 1024 * 1024, `${(size / 1024).toFixed(0)} KB`],
  ['无外部资源引用（完全离线，无 CDN/无分片）', !/(src|href)="(https?:|\/assets|\.\/assets)/.test(html)],
  ['内联脚本在离线包内完整存在', inline.length > 500000, `${(inline.length / 1024).toFixed(0)} KB 脚本`],
  ['React 成功挂载', inner.length > 500],
  ['课程标题渲染', text.includes('太阳系的秘密')],
  ['三关关卡地图渲染', text.includes('认识八大行星') && text.includes('为什么有四季')],
  ['四种立体模式入口齐全', ['视差立体', '红蓝眼镜', '左右分屏', '头部追踪'].every((m) => text.includes(m))],
  ['无 WebGL 时降级不白屏', text.includes('不支持 3D') || text.includes('开始上课')],
]

let pass = 0
console.log('离线单文件版冒烟测试')
for (const [n, ok, extra] of checks) {
  console.log(`  ${ok ? '✓' : '✗'} ${n}${extra ? ' — ' + extra : ''}`)
  if (ok) pass++
}
console.log(`\n通过 ${pass}/${checks.length}`)
process.exit(pass === checks.length ? 0 : 1)
