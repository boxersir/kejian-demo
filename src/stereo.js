import * as THREE from 'three'

// ===== 裸眼立体相机装置 =====
// three.StereoCamera 产出左右眼视图；我们把它按不同模式拼进一张画布/两个画布。
// parallax 模式双倍渲染开销（两眼各渲一次），因此低配设备由调用方降级（见 usePerf）。

export const EYE = { separation: 0.06, convergence: 12 }

export function makeStereoCamera() {
  const stereo = new THREE.StereoCamera()
  stereo.aspect = 1
  stereo.eyeSep = EYE.separation
  stereo.update = THREE.StereoCamera.prototype.update
  return stereo
}

// 把左右眼渲染到同一 target 的左右两半（SBS）或叠加通道（Anaglyph 用自定义材质混合）
export function renderSBS(renderer, scene, camera, stereo, width, height, mode, target) {
  stereo.eyeSep = mode === 'anaglyph' ? 0.035 : EYE.separation
  stereo.update(camera)

  const half = Math.floor(width / 2)
  const autoClear = renderer.autoClear
  renderer.autoClear = false

  if (target) renderer.setRenderTarget(target)
  else renderer.setRenderTarget(null)

  // 右眼（先画，落在右半区）
  renderer.setViewport(half, 0, half, height)
  renderer.setScissor(half, 0, half, height)
  renderer.setScissorTest(true)
  renderer.clear(true, true, true)
  renderer.render(scene, stereo.cameraR)

  // 左眼
  renderer.setViewport(0, 0, half, height)
  renderer.setScissor(0, 0, half, height)
  renderer.clear(true, true, true)
  renderer.render(scene, stereo.cameraL)

  renderer.setScissorTest(false)
  renderer.setViewport(0, 0, width, height)
  renderer.autoClear = autoClear
  if (target) renderer.setRenderTarget(null)
}
