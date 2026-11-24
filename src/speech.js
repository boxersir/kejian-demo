// 语音层：Demo 用浏览器 SpeechSynthesis（零依赖）；生产替换为 piper 预生成 mp3
let zhVoice = null

function pickVoice() {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  zhVoice =
    voices.find((v) => /zh[-_]CN/i.test(v.lang) && /Xiaoxiao|Yaoyao|Huihui|Tingting/i.test(v.name)) ||
    voices.find((v) => /zh/i.test(v.lang)) ||
    null
  return zhVoice
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = pickVoice
  pickVoice()
}

export function speak(text, { enabled = true, rate = 0.95 } = {}) {
  if (!enabled || !text || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = rate
    u.pitch = 1.05
    if (zhVoice) u.voice = zhVoice
    window.speechSynthesis.speak(u)
  } catch {
    /* 语音不可用不影响教学 */
  }
}

export function stopSpeak() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

// 极简音效（WebAudio 合成，零资源体积）
let ctx = null
export function beep(kind = 'ok', enabled = true) {
  if (!enabled) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    const notes = kind === 'ok' ? [660, 990] : kind === 'win' ? [523, 659, 784, 1046] : [220, 165]
    notes.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = kind === 'fail' ? 'sawtooth' : 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, now + i * 0.09)
      g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.09 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.22)
      o.connect(g).connect(ctx.destination)
      o.start(now + i * 0.09)
      o.stop(now + i * 0.09 + 0.25)
    })
  } catch {
    /* ignore */
  }
}
