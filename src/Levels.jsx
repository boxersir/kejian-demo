import { useState, useEffect } from 'react'
import { planets, quizBank } from './courseware'

// ============ 第 1 关：行星图鉴 ============
export function Level1Panel() {
  const collected = useGameSafe((s) => s.collected)
  return (
    <div style={card}>
      <PanelHead
        kicker="第 1 关 · 观察探索"
        title="八大行星图鉴"
        desc="在右侧 3D 世界里拖拽旋转，点选行星。点齐 8 颗即可通关。"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
        {planets.map((p) => {
          const got = collected.includes(p.id)
          return (
            <div key={p.id} style={chip(got, p.color)}>
              <span style={{ width: 10, height: 10, borderRadius: 10, background: p.color, boxShadow: got ? `0 0 12px ${p.color}` : 'none' }} />
              <span style={{ fontSize: 12, opacity: got ? 1 : 0.5 }}>{got ? p.name : '???'}</span>
            </div>
          )
        })}
      </div>
      <Progress value={collected.length} total={8} />
      <FooterNote>收集进度 {collected.length} / 8</FooterNote>
    </div>
  )
}

// ============ 第 2 关：排序 ============
const ORDER = ['mercury', 'earth', 'jupiter', 'neptune']
const L2_POOL = planets.filter((p) => ORDER.includes(p.id))

export function Level2Panel() {
  const slots = useGameSafe((s) => s.slots)
  const setSlot = useGameSafe((s) => s.setSlot)
  const addScore = useGameSafe((s) => s.addScore)
  const addMistake = useGameSafe((s) => s.addMistake)
  const setToast = useGameSafe((s) => s.setToast)
  const finishLevel = useGameSafe((s) => s.finishLevel)
  const sound = useGameSafe((s) => s.sound)
  const mistakes = useGameSafe((s) => s.mistakes)
  const [dragId, setDragId] = useState(null)
  const [checked, setChecked] = useState(false)
  const [result, setResult] = useState(null)

  const used = slots.filter(Boolean)

  const drop = (idx) => {
    if (!dragId) return
    setSlot(idx, dragId)
    setDragId(null)
    beepSafe('ok', sound)
    setChecked(false)
    setResult(null)
  }

  const check = () => {
    const ok = slots.every((id, i) => id === ORDER[i])
    setChecked(true)
    setResult(ok)
    if (ok) {
      beepSafe('win', sound)
      addScore(200, '排序全对')
      setToast('排序正确！离太阳由近到远：水星 → 地球 → 木星 → 海王星')
      setTimeout(() => finishLevel(mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1), 700)
    } else {
      beepSafe('fail', sound)
      addMistake()
      setToast('还没完全正确，看看哪一颗放错了？')
    }
  }

  return (
    <div style={card}>
      <PanelHead
        kicker="第 2 关 · 排序挑战"
        title="离太阳有多远？"
        desc="把行星卡片拖进卡槽，由近到远排好队。"
      />
      <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
        <div style={{ flex: 1 }}>
          <Label>太阳 ☀</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {[0, 1, 2, 3].map((i) => {
              const id = slots[i]
              const p = planets.find((x) => x.id === id)
              const wrong = checked && id !== ORDER[i]
              return (
                <div
                  key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => drop(i)}
                  onClick={() => dragId && drop(i)}
                  style={slotStyle(!!p, wrong)}
                >
                  <span style={ordNum}>{i + 1}</span>
                  {p ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i style={{ width: 9, height: 9, borderRadius: 9, background: p.color }} />
                      {p.name}
                    </span>
                  ) : (
                    <span style={{ opacity: 0.4 }}>拖到这里</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ width: 130 }}>
          <Label>行星池</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {L2_POOL.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragId(p.id)}
                onClick={() => setDragId(dragId === p.id ? null : p.id)}
                style={poolStyle(dragId === p.id, used.includes(p.id))}
              >
                <i style={{ width: 9, height: 9, borderRadius: 9, background: p.color }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={check} disabled={slots.some((s) => !s)} style={btnPrimary(slots.some((s) => !s))}>
        检查答案
      </button>
      {checked && (
        <div style={{ marginTop: 12, fontSize: 13, color: result === false ? '#ff9b9b' : '#8ff0c0' }}>
          {result === false ? `错误 ${mistakes} 次：提示——水星最近，海王星最远。` : '全部正确！'}
        </div>
      )}
      {!checked && <FooterNote>点击或拖拽卡片放置 · 再次点击卡片可取消</FooterNote>}
    </div>
  )
}

// ============ 第 3 关：答题 ============
export function Level3Panel() {
  const quizIdx = useGameSafe((s) => s.quizIdx)
  const quizDone = useGameSafe((s) => s.quizDone)
  const answerQuiz = useGameSafe((s) => s.answerQuiz)
  const addScore = useGameSafe((s) => s.addScore)
  const addMistake = useGameSafe((s) => s.addMistake)
  const finishLevel = useGameSafe((s) => s.finishLevel)
  const setToast = useGameSafe((s) => s.setToast)
  const sound = useGameSafe((s) => s.sound)
  const mistakes = useGameSafe((s) => s.mistakes)
  const [picked, setPicked] = useState(null)

  const q = quizBank[quizIdx]
  useEffect(() => setPicked(null), [quizIdx])

  if (!q) {
    return (
      <div style={card}>
        <PanelHead kicker="第 3 关 · 知识问答" title="本关已完成" desc="准备进入通关结算。" />
      </div>
    )
  }

  const pick = (i) => {
    if (picked !== null) return
    setPicked(i)
    const ok = i === q.answer
    if (ok) {
      beepSafe('ok', sound)
      addScore(150, '答对')
      setToast('答对啦！')
    } else {
      beepSafe('fail', sound)
      addMistake()
      setToast('再想一想：' + q.why)
    }
    setTimeout(() => {
      answerQuiz(ok)
      const newDone = quizDone + (ok ? 1 : 0)
      const isLast = quizIdx + 1 >= quizBank.length
      if (isLast) finishLevel(newDone === quizBank.length && mistakes === 0 ? 3 : newDone === quizBank.length ? 2 : 1)
    }, 900)
  }

  return (
    <div style={card}>
      <PanelHead kicker={`第 3 关 · 知识问答 ${quizIdx + 1}/${quizBank.length}`} title="太阳系的规律" desc={q.q} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
        {q.options.map((opt, i) => {
          const isPicked = picked === i
          const isRight = i === q.answer
          let border = '1px solid rgba(140,170,255,0.22)'
          let bg = 'rgba(20,28,54,0.75)'
          if (picked !== null && isPicked && isRight) {
            border = '1px solid #52e0a2'
            bg = 'rgba(30,80,60,0.85)'
          } else if (picked !== null && isPicked && !isRight) {
            border = '1px solid #ff7d7d'
            bg = 'rgba(90,30,40,0.85)'
          } else if (picked !== null && isRight) {
            border = '1px solid rgba(82,224,162,0.6)'
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 12,
                border,
                background: bg,
                color: '#e8eeff',
                fontSize: 14,
                cursor: picked === null ? 'pointer' : 'default',
                transition: 'all .18s',
              }}
            >
              <b style={{ opacity: 0.55, marginRight: 8 }}>{'ABCD'[i]}</b>
              {opt}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.6, color: '#a9dbff', background: 'rgba(30,60,110,0.4)', padding: 12, borderRadius: 10 }}>
          <b>解析：</b>
          {q.why}
        </div>
      )}
      <FooterNote>答对 {quizDone} / {quizBank.length} 题</FooterNote>
    </div>
  )
}

// ============ 通用小组件 ============
export function PanelHead({ kicker, title, desc }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: '#7aa7ff', textTransform: 'uppercase' }}>{kicker}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: '#fff', fontFamily: 'system-ui, "PingFang SC", "Microsoft YaHei"' }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(215,226,255,0.72)', marginTop: 8 }}>{desc}</div>
    </div>
  )
}

export function Progress({ value, total }) {
  const pct = Math.min(100, (value / total) * 100)
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.09)', borderRadius: 6, marginTop: 16, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#4d7dff,#63e6ff)', transition: 'width .4s' }} />
    </div>
  )
}

const Label = ({ children }) => (
  <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(160,185,255,0.7)' }}>{children}</div>
)
const FooterNote = ({ children }) => (
  <div style={{ marginTop: 14, fontSize: 11.5, color: 'rgba(170,190,230,0.45)' }}>{children}</div>
)

const card = {
  background: 'linear-gradient(180deg, rgba(16,23,44,0.92), rgba(10,15,30,0.94))',
  border: '1px solid rgba(110,150,255,0.18)',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
  backdropFilter: 'blur(14px)',
  color: '#e8eeff',
}

const chip = (got, color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 9px',
  borderRadius: 10,
  border: got ? `1px solid ${color}66` : '1px solid rgba(255,255,255,0.08)',
  background: got ? `${color}1a` : 'rgba(255,255,255,0.03)',
})

const slotStyle = (filled, wrong) => ({
  height: 40,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 12px',
  borderRadius: 11,
  border: wrong ? '1px solid #ff7575' : filled ? '1px solid rgba(99,230,255,0.55)' : '1px dashed rgba(140,170,255,0.3)',
  background: filled ? 'rgba(30,60,120,0.55)' : 'rgba(255,255,255,0.02)',
  fontSize: 13.5,
  cursor: 'pointer',
})

const ordNum = {
  width: 18,
  height: 18,
  borderRadius: 18,
  display: 'grid',
  placeItems: 'center',
  fontSize: 10,
  background: 'rgba(255,255,255,0.1)',
}

const poolStyle = (active, used) => ({
  height: 40,
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '0 12px',
  borderRadius: 11,
  border: active ? '1px solid #63e6ff' : '1px solid rgba(255,255,255,0.12)',
  background: active ? 'rgba(60,130,255,0.3)' : 'rgba(255,255,255,0.04)',
  fontSize: 13.5,
  cursor: 'grab',
  opacity: used ? 0.4 : 1,
  userSelect: 'none',
})

const btnPrimary = (disabled) => ({
  marginTop: 18,
  width: '100%',
  padding: '12px 0',
  borderRadius: 12,
  border: 'none',
  background: disabled ? 'rgba(255,255,255,0.12)' : 'linear-gradient(90deg,#4d7dff,#63e6ff)',
  color: disabled ? 'rgba(255,255,255,0.4)' : '#08111f',
  fontWeight: 800,
  fontSize: 14,
  letterSpacing: 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

// 避免与 store 循环依赖：在这里直接引 store
import { useGame } from './store'
const useGameSafe = useGame
import { beep as beepSafe } from './speech'
