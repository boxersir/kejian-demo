import { create } from 'zustand'

export const useGame = create((set, get) => ({
  stereo: 'parallax',
  setStereo: (s) => set({ stereo: s }),

  level: 0,
  phase: 'intro', // intro | play | clear
  score: 0,
  combo: 0,
  stars: [0, 0, 0],
  collected: [],
  slots: [null, null, null, null],
  quizIdx: 0,
  quizDone: 0,
  toast: null,
  sound: true,
  hintShown: false,
  mistakes: 0,
  startedAt: null,

  toggleSound: () => set((s) => ({ sound: !s.sound })),
  setToast: (t) => {
    set({ toast: t })
    clearTimeout(get()._toastTimer)
    const timer = setTimeout(() => set({ toast: null }), 2200)
    set({ _toastTimer: timer })
  },

  startLevel: () => set({ phase: 'play', startedAt: Date.now() }),

  nextLevel: () =>
    set((s) => ({
      level: Math.min(s.level + 1, 2),
      phase: 'intro',
      quizIdx: 0,
      quizDone: 0,
      mistakes: 0,
      hintShown: false,
    })),

  restartAll: () =>
    set({
      level: 0,
      phase: 'intro',
      score: 0,
      combo: 0,
      stars: [0, 0, 0],
      collected: [],
      slots: [null, null, null, null],
      quizIdx: 0,
      quizDone: 0,
      mistakes: 0,
    }),

  addScore: (n, reason) =>
    set((s) => {
      const combo = s.combo + 1
      const mult = combo >= 5 ? 3 : combo >= 3 ? 2 : 1
      return { score: s.score + n * mult, combo, toast: reason ? `${reason} +${n * mult}` : s.toast }
    }),
  addMistake: () => set((s) => ({ combo: 0, mistakes: s.mistakes + 1 })),

  collect: (id) => set((s) => (s.collected.includes(id) ? {} : { collected: [...s.collected, id] })),

  setSlot: (index, planetId) =>
    set((s) => {
      const slots = [...s.slots]
      const exist = slots.indexOf(planetId)
      if (exist >= 0) slots[exist] = null
      slots[index] = planetId
      return { slots }
    }),

  answerQuiz: (ok) => set((s) => ({ quizDone: s.quizDone + (ok ? 1 : 0), quizIdx: s.quizIdx + 1 })),

  setStars: (idx, n) =>
    set((s) => {
      const stars = [...s.stars]
      stars[idx] = Math.max(stars[idx], n)
      return { stars }
    }),

  finishLevel: (starCount) => {
    const s = get()
    s.setStars(s.level, starCount)
    set({ phase: 'clear' })
  },
}))
