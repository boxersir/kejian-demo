import { Component } from 'react'

// 关键：3D 场景崩溃（老设备 / 禁用 WebGL / 驱动异常）不能拖垮整个课堂页面。
// 降级后仍可完成"读题—答题—看报告"，并把原因明确告知老师。
export class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false, msg: '' }
  }

  static getDerivedStateFromError(err) {
    return { failed: true, msg: String(err?.message || err) }
  }

  componentDidCatch(err) {
    console.warn('[星栖课堂] 3D 场景已降级，UI 教学流程继续可用：', err?.message)
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'radial-gradient(circle at 50% 40%, #0d1730, #05070f 70%)',
            padding: 24,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 520 }}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>🛰️</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e8eeff', marginBottom: 8 }}>本设备暂不支持 3D 场景</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(200,215,255,0.6)' }}>
              可能是浏览器禁用了 WebGL 或显卡驱动过旧。
              <br />
              教学流程不受影响：右侧面板可继续完成闯关与课堂报告。
              <br />
              建议：换用 Chrome / Edge 最新版，或在设置中开启"硬件加速"。
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
