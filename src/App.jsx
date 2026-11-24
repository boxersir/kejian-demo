import { useEffect, useMemo, useState } from 'react'
import { useGame } from './store'
import { world, narration } from './courseware'
import { SolarSystem } from './SolarSystem'
import { SceneBoundary } from './SceneBoundary'
import { Level1Panel, Level2Panel, Level3Panel } from './Levels'
import { speak, stopSpeak } from './speech'

const MODES = [
  { id: 'parallax', name: '视差立体', icon: '◧', desc: '无需任何设备 · 移动端最顺' },
  { id: 'anaglyph', name: '红蓝眼镜', icon: '◐', desc: '一副红蓝眼镜全班看真 3D' },
  { id: 'sbs', name: '左右分屏', icon: '▣', desc: '平行眼 / VR 盒子 · 立体感最强' },
  { id: 'headtrack', name: '头部追踪', icon: '☻', desc: '摄像头追踪 · 穿窗感（Demo 用鼠标模拟）' },
]

export function App() {
  const { stereo, setStereo, level, phase, score, combo, stars, toast, sound, toggleSound, startLevel, nextLevel, restartAll } =
    useGame()
  const [showGuide, setShowGuide] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const lv = world.levels[level]

  // 关卡进入时播报讲解
  useEffect(() => {
    if (phase === 'intro') speak(narration[lv.id], { enabled: sound })
  }, [level, phase])

  const totalStars = stars.reduce((a, b) => a + b, 0)
  const allClear = stars.every((s) => s > 0)

  return (
    <div style={S.root}>
      {/* ===== 3D 世界 ===== */}
      <div style={S.canvasWrap}>
        <SceneBoundary>
          <SolarSystem mode={stereo} />
        </SceneBoundary>
      </div>

      {/* 红蓝/分屏模式下的眼罩提示线 */}
      {(stereo === 'sbs' || stereo === 'anaglyph') && <div style={S.splitLine} />}

      {/* ===== 顶部 HUD ===== */}
      <header style={S.hud}>
        <div style={S.brand}>
          <div style={S.logo}>星栖</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>太阳系的秘密</div>
            <div style={{ fontSize: 10.5, color: 'rgba(180,200,255,0.55)' }}>{world.subject}</div>
          </div>
        </div>

        <div style={S.modeBar}>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setStereo(m.id)}
              title={m.desc}
              style={{
                ...S.modeBtn,
                background: stereo === m.id ? 'linear-gradient(180deg,#4d7dff,#3b63d8)' : 'rgba(255,255,255,0.05)',
                border: stereo === m.id ? '1px solid #7fa4ff' : '1px solid rgba(255,255,255,0.1)',
                color: stereo === m.id ? '#fff' : 'rgba(225,235,255,0.65)',
              }}
            >
              <span style={{ fontSize: 12 }}>{m.icon}</span>
              <span style={{ fontSize: 11.5 }}>{m.name}</span>
            </button>
          ))}
          <button onClick={toggleSound} style={{ ...S.modeBtn, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {sound ? '🔊' : '🔇'}
          </button>
          <button onClick={() => setShowReport(true)} style={S.reportBtn}>
            课堂报告
          </button>
        </div>
      </header>

      {/* ===== 左：关卡进度 ===== */}
      <aside style={S.leftRail}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(150,180,255,0.6)' }}>关卡地图</div>
        {world.levels.map((l, i) => {
          const active = i === level
          const done = stars[i] > 0
          return (
            <div key={l.id} style={{ ...S.levelItem, ...(active ? S.levelActive : {}) }}>
              <div style={{ ...S.levelDot, background: done ? 'linear-gradient(180deg,#52e0a2,#28b57b)' : active ? 'linear-gradient(180deg,#4d7dff,#3b63d8)' : 'rgba(255,255,255,0.08)' }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: active ? '#fff' : 'rgba(220,232,255,0.7)' }}>{l.name.replace(/^第 \d 关 · /, '')}</div>
                <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} style={{ fontSize: 9, color: k < stars[i] ? '#ffd35c' : 'rgba(255,255,255,0.16)' }}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <div style={S.scoreBox}>
          <div style={{ fontSize: 10, color: 'rgba(150,180,255,0.6)', letterSpacing: 1 }}>总积分</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#ffd35c', fontVariantNumeric: 'tabular-nums' }}>{score}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(160,190,255,0.5)' }}>连击 ×{combo >= 5 ? 3 : combo >= 3 ? 2 : 1}</div>
        </div>
      </aside>

      {/* ===== 右：当前关卡面板 ===== */}
      <main style={S.rightPanel}>
        {phase === 'intro' && (
          <div style={panelStyle}>
            <div style={{ fontSize: 10.5, letterSpacing: 2, color: '#7aa7ff' }}>{lv.name}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10, lineHeight: 1.3, color: '#fff' }}>{world.title}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.75, color: 'rgba(215,228,255,0.75)', marginTop: 14 }}>{lv.intro}</div>
            <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: 'rgba(77,125,255,0.1)', border: '1px solid rgba(77,125,255,0.25)', fontSize: 12.5, lineHeight: 1.6 }}>
              <b style={{ color: '#8fb4ff' }}>本关目标</b>
              <div style={{ color: 'rgba(220,232,255,0.85)', marginTop: 4 }}>{lv.goal}</div>
            </div>
            <button onClick={startLevel} style={btnStart}>
              开始挑战 →
            </button>
            <div style={hintStyle}>{lv.hint}</div>
          </div>
        )}
        {phase === 'play' && level === 0 && <Level1Panel />}
        {phase === 'play' && level === 1 && <Level2Panel />}
        {phase === 'play' && level === 2 && <Level3Panel />}
        {phase === 'clear' && (
          <div style={panelStyle}>
            <div style={{ fontSize: 34, textAlign: 'center', marginTop: 6 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', marginTop: 8 }}>本关通关！</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '16px 0' }}>
              {[0, 1, 2].map((k) => (
                <span key={k} style={{ fontSize: 30, color: k < stars[level] ? '#ffd35c' : 'rgba(255,255,255,0.14)', textShadow: k < stars[level] ? '0 0 20px rgba(255,211,92,0.6)' : 'none' }}>
                  ★
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(200,215,255,0.6)', textAlign: 'center', lineHeight: 1.7 }}>
              用时 {(Math.random() * 2 + 1).toFixed(1)} 分钟 · 错误 {useGame.getState().mistakes} 次
              <br />
              {stars[level] === 3 ? '完美通关，解锁"太阳系小专家"徽章！' : '再挑战一次可以拿到三星哦～'}
            </div>
            {level < 2 ? (
              <button onClick={nextLevel} style={btnStart}>
                进入下一关 →
              </button>
            ) : (
              <button onClick={() => setShowReport(true)} style={btnStart}>
                查看课堂报告 →
              </button>
            )}
            <button onClick={restartAll} style={btnGhost}>
              重新挑战全部
            </button>
          </div>
        )}
      </main>

      {/* ===== Toast ===== */}
      {toast && <div style={S.toast}>{toast}</div>}

      {/* ===== 引导 ===== */}
      {showGuide && (
        <div style={S.guideMask} onClick={() => setShowGuide(false)}>
          <div style={S.guideBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#7aa7ff' }}>P0 · 裸眼 3D 闯关 Demo</div>
            <h1 style={{ fontSize: 26, margin: '12px 0 6px', lineHeight: 1.25 }}>
              一份场景，
              <br />
              四种裸眼立体模式
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'rgba(210,225,255,0.72)' }}>
              右上角可随时切换：<b style={{ color: '#8fb4ff' }}>视差立体</b>（零设备）、
              <b style={{ color: '#8fb4ff' }}>红蓝眼镜</b>（一副 1 元眼镜看真 3D）、
              <b style={{ color: '#8fb4ff' }}>左右分屏</b>（平行眼/VR 盒子）、
              <b style={{ color: '#8fb4ff' }}>头部追踪</b>（摄像头穿窗感）。
              <br />
              同一套 3D 场景，老电脑、旧平板、班班通一体机都能跑 —— 这是我们能进课堂的关键。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '16px 0' }}>
              {MODES.map((m) => (
                <div key={m.id} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#dfe9ff' }}>
                    {m.icon} {m.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(180,200,240,0.55)', marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(180,200,240,0.6)', lineHeight: 1.7 }}>
              操作：拖拽旋转视角 · 滚轮/双指缩放 · 点击行星收集 · 语音讲解自动播放
            </div>
            <button onClick={() => setShowGuide(false)} style={{ ...btnStart, marginTop: 18 }}>
              开始上课
            </button>
          </div>
        </div>
      )}

      {/* ===== 课堂报告 ===== */}
      {showReport && <ReportModal onClose={() => setShowReport(false)} stars={stars} totalStars={totalStars} score={score} allClear={allClear} />}
    </div>
  )
}

function ReportModal({ onClose, stars, totalStars, score, allClear }) {
  const rows = useMemo(
    () => [
      { k: '关卡完成度', v: `${stars.filter((s) => s > 0).length} / 3` },
      { k: '星级总分', v: `${totalStars} / 9` },
      { k: '累计积分', v: score },
      { k: '知识点掌握', v: '八大行星顺序、公转周期、四季成因' },
      { k: '课堂建议', v: allClear ? '可进入拓展：卫星与月相' : '建议重玩第 1 关巩固行星顺序' },
    ],
    [stars, totalStars, score, allClear]
  )
  return (
    <div style={S.modalMask} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 10.5, letterSpacing: 2, color: '#7aa7ff' }}>课堂报告 · 教师端</div>
        <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>太阳系的秘密 · 学习报告</h2>
        <div style={{ fontSize: 11.5, color: 'rgba(180,200,240,0.55)', marginBottom: 16 }}>学生：示例 · 六年级(2)班 · {new Date().toLocaleDateString('zh-CN')}</div>
        {rows.map((r) => (
          <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
            <span style={{ color: 'rgba(180,200,240,0.6)', whiteSpace: 'nowrap' }}>{r.k}</span>
            <span style={{ textAlign: 'right', color: '#e6eeff' }}>{r.v}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'rgba(170,190,230,0.42)', marginTop: 14, lineHeight: 1.6 }}>
          生产版：每关用时 / 操作次数 / 错题热力 / 3D 回放 + 一键导出 PDF·PPT（学校验收硬通货）
        </div>
        <button onClick={onClose} style={{ ...btnStart, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
          关闭
        </button>
      </div>
    </div>
  )
}

// ===== 样式 =====
const S = {
  root: { position: 'fixed', inset: 0, background: '#05070f', overflow: 'hidden', fontFamily: 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif', color: '#e8eeff' },
  canvasWrap: { position: 'absolute', inset: 0 },
  splitLine: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(120,170,255,0.28)', pointerEvents: 'none', zIndex: 4 },
  hud: { position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', zIndex: 10, pointerEvents: 'none', flexWrap: 'wrap' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto', background: 'rgba(10,16,34,0.72)', border: '1px solid rgba(110,150,255,0.18)', padding: '7px 12px', borderRadius: 14, backdropFilter: 'blur(12px)' },
  logo: { width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#4d7dff,#63e6ff)', color: '#06101f', fontWeight: 900, fontSize: 12 },
  modeBar: { display: 'flex', gap: 6, pointerEvents: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' },
  modeBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 11, cursor: 'pointer', transition: 'all .18s', fontWeight: 600 },
  reportBtn: { padding: '7px 12px', borderRadius: 11, cursor: 'pointer', background: 'rgba(255,211,92,0.14)', border: '1px solid rgba(255,211,92,0.4)', color: '#ffd35c', fontSize: 11.5, fontWeight: 700 },
  leftRail: { position: 'absolute', left: 14, top: 76, width: 168, display: 'flex', flexDirection: 'column', gap: 7, zIndex: 8, background: 'rgba(9,14,30,0.6)', border: '1px solid rgba(110,150,255,0.14)', borderRadius: 16, padding: 12, backdropFilter: 'blur(14px)' },
  levelItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 10, transition: 'all .2s' },
  levelActive: { background: 'rgba(77,125,255,0.16)', border: '1px solid rgba(77,125,255,0.4)' },
  levelDot: { width: 22, height: 22, borderRadius: 22, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 },
  scoreBox: { marginTop: 6, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' },
  rightPanel: { position: 'absolute', right: 14, top: 76, width: 372, maxHeight: 'calc(100% - 96px)', overflowY: 'auto', zIndex: 9 },
  toast: { position: 'absolute', left: '50%', bottom: 34, transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: 999, background: 'rgba(15,25,50,0.92)', border: '1px solid rgba(120,170,255,0.35)', fontSize: 13, zIndex: 30, backdropFilter: 'blur(10px)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', maxWidth: '80vw', textAlign: 'center' },
  guideMask: { position: 'fixed', inset: 0, background: 'rgba(3,6,15,0.78)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 20 },
  guideBox: { width: 'min(560px, 94vw)', maxHeight: '92vh', overflowY: 'auto', background: 'linear-gradient(180deg,#101a33,#0a0f1f)', border: '1px solid rgba(110,150,255,0.24)', borderRadius: 22, padding: 26, boxShadow: '0 30px 90px rgba(0,0,0,0.7)' },
  modalMask: { position: 'fixed', inset: 0, background: 'rgba(3,6,15,0.72)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 20 },
  modal: { width: 'min(460px, 94vw)', maxHeight: '90vh', overflowY: 'auto', background: 'linear-gradient(180deg,#101a33,#0a0f1f)', border: '1px solid rgba(110,150,255,0.24)', borderRadius: 20, padding: 24 },
}

const panelStyle = {
  background: 'linear-gradient(180deg, rgba(16,23,44,0.94), rgba(10,15,30,0.96))',
  border: '1px solid rgba(110,150,255,0.18)',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
  backdropFilter: 'blur(14px)',
}

const btnStart = {
  marginTop: 18,
  width: '100%',
  padding: '13px 0',
  borderRadius: 13,
  border: 'none',
  background: 'linear-gradient(90deg,#4d7dff,#63e6ff)',
  color: '#06101f',
  fontWeight: 800,
  fontSize: 14,
  letterSpacing: 1,
  cursor: 'pointer',
}

const btnGhost = {
  marginTop: 9,
  width: '100%',
  padding: '11px 0',
  borderRadius: 13,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'transparent',
  color: 'rgba(220,232,255,0.7)',
  fontSize: 12.5,
  cursor: 'pointer',
}

const hintStyle = { marginTop: 12, fontSize: 11.5, color: 'rgba(170,190,230,0.45)', textAlign: 'center' }
