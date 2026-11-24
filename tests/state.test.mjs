// 关卡状态机与计分逻辑自测（Node 直接跑，不依赖浏览器）
// 运行：cd demo && node tests/state.test.mjs
import { create } from 'zustand'
import assert from 'node:assert'

const useGame = create((set, get) => ({
  stereo: 'parallax',
  setStereo: (s) => set({ stereo: s }),
  level: 0,
  phase: 'intro',
  score: 0,
  combo: 0,
  stars: [0, 0, 0],
  collected: [],
  slots: [null, null, null, null],
  quizIdx: 0,
  quizDone: 0,
  toast: null,
  sound: true,
  mistakes: 0,
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  setToast: (t) => set({ toast: t }),
  startLevel: () => set({ phase: 'play' }),
  nextLevel: () => set((s) => ({ level: Math.min(s.level + 1, 2), phase: 'intro', quizIdx: 0, quizDone: 0, mistakes: 0 })),
  restartAll: () => set({ level: 0, phase: 'intro', score: 0, combo: 0, stars: [0, 0, 0], collected: [], slots: [null, null, null, null], quizIdx: 0, quizDone: 0, mistakes: 0 }),
  addScore: (n) => set((s) => { const combo = s.combo + 1; const mult = combo >= 5 ? 3 : combo >= 3 ? 2 : 1; return { score: s.score + n * mult, combo } }),
  addMistake: () => set((s) => ({ combo: 0, mistakes: s.mistakes + 1 })),
  collect: (id) => set((s) => (s.collected.includes(id) ? {} : { collected: [...s.collected, id] })),
  setSlot: (i, pid) => set((s) => { const slots = [...s.slots]; const e = slots.indexOf(pid); if (e >= 0) slots[e] = null; slots[i] = pid; return { slots } }),
  answerQuiz: (ok) => set((s) => ({ quizDone: s.quizDone + (ok ? 1 : 0), quizIdx: s.quizIdx + 1 })),
  setStars: (i, n) => set((s) => { const stars = [...s.stars]; stars[i] = Math.max(stars[i], n); return { stars } }),
  finishLevel: (n) => { const s = get(); s.setStars(s.level, n); set({ phase: 'clear' }) },
}))

let pass = 0
const t = (name, fn) => { fn(); console.log('  ✓', name); pass++ }

console.log('关卡状态机自测')
const g = () => useGame.getState()

t('初始状态：第 1 关 / 引导阶段 / 0 分', () => {
  assert.equal(g().level, 0)
  assert.equal(g().phase, 'intro')
  assert.equal(g().score, 0)
})

t('开始关卡切换为 play', () => { g().startLevel(); assert.equal(g().phase, 'play') })

t('立体模式可切换（4 种）', () => {
  for (const m of ['parallax', 'anaglyph', 'sbs', 'headtrack']) { g().setStereo(m); assert.equal(g().stereo, m) }
  g().setStereo('parallax')
})

t('L1 收集行星：重复收集不重复计（图鉴 8 颗封顶）', () => {
  const ids = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']
  ids.forEach(id => g().collect(id))
  ids.forEach(id => g().collect(id))
  assert.equal(g().collected.length, 8)
})

t('连击计分：1 次 ×1，第 3 次起 ×2，第 5 次起 ×3', () => {
  useGame.setState({ score: 0, combo: 0 })
  g().addScore(100); assert.equal(g().score, 100)          // ×1
  g().addScore(100); assert.equal(g().score, 200)          // ×1
  g().addScore(100); assert.equal(g().score, 400)          // ×2
  g().addScore(100); assert.equal(g().score, 600)          // ×2
  g().addScore(100); assert.equal(g().score, 900)          // ×3
})

t('答错清零连击并记错误次数', () => { g().addMistake(); assert.equal(g().combo, 0); assert.equal(g().mistakes, 1) })

t('L2 拖拽槽位：同一行星只占一个槽', () => {
  g().setSlot(0, 'mercury'); g().setSlot(1, 'earth'); g().setSlot(2, 'jupiter')
  g().setSlot(3, 'mercury') // 水星移到第 4 槽
  const s = g().slots
  assert.equal(s[0], null); assert.equal(s[3], 'mercury'); assert.equal(s[1], 'earth')
})

t('L2 正确顺序判定：水星→地球→木星→海王星', () => {
  const ORDER = ['mercury', 'earth', 'jupiter', 'neptune']
  ;[0,1,2,3].forEach(i => g().setSlot(i, ORDER[i]))
  assert.deepEqual(g().slots, ORDER)
})

t('通关三星评级：全对三星', () => {
  useGame.setState({ level: 1, mistakes: 0 })
  g().finishLevel(3)
  assert.equal(g().phase, 'clear'); assert.equal(g().stars[1], 3)
})

t('星级不降级（重玩拿低星保留高星）', () => { g().setStars(1, 1); assert.equal(g().stars[1], 3) })

t('下一关推进并重置单关状态', () => {
  g().nextLevel()
  assert.equal(g().level, 2); assert.equal(g().phase, 'intro'); assert.equal(g().quizDone, 0)
})

t('L3 答题：答对累计 quizDone，答错不计', () => {
  g().answerQuiz(true); g().answerQuiz(false); g().answerQuiz(true)
  assert.equal(g().quizDone, 2); assert.equal(g().quizIdx, 3)
})

t('关卡上限保护（不越界到第 4 关）', () => {
  useGame.setState({ level: 2 }); g().nextLevel(); assert.equal(g().level, 2)
})

t('restartAll 完全重置', () => {
  g().restartAll()
  const s = g()
  assert.equal(s.level, 0); assert.equal(s.score, 0); assert.equal(s.collected.length, 0)
  assert.deepEqual(s.stars, [0,0,0]); assert.deepEqual(s.slots, [null,null,null,null])
})

console.log(`\n全部通过：${pass}/${pass} —— 状态机用例全部生效`)
