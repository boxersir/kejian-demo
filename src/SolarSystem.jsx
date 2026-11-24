import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { planets } from './courseware'
import { useGame } from './store'
import { beep, speak } from './speech'
import { renderSBS } from './stereo'

// 太阳系世界：太阳 + 8 颗行星 + 轨道 + 星尘
export function SolarSystem({ mode }) {
  const mountRef = useRef(null)
  const stateRef = useRef({})

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const lowPerf = !/Mobi|Android|iPhone|iPad/.test(navigator.userAgent) ? false : true

    const renderer = new THREE.WebGLRenderer({
      antialias: !lowPerf,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPerf ? 1.5 : 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x05070f, 1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x05070f, 0.0035)

    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 800)
    const camState = { theta: 0, phi: 1.05, radius: 46, target: new THREE.Vector3(0, 0, 0) }
    const stereo = new THREE.StereoCamera()
    stereo.aspect = 1
    stereo.eyeSep = 0.06

    // ===== 光照 =====
    scene.add(new THREE.AmbientLight(0x5570aa, 0.55))
    const sunLight = new THREE.PointLight(0xffd08a, 2600, 400, 1.8)
    scene.add(sunLight)

    // ===== 星空（球壳粒子）=====
    const starGeo = new THREE.BufferGeometry()
    const N = 3600
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const r = 120 + Math.random() * 260
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(p) * Math.cos(t)
      pos[i * 3 + 1] = r * Math.cos(p) * 0.7
      pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t)
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.12, 0.5, 0.6 + Math.random() * 0.4)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 1.6, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })
    )
    scene.add(stars)

    // ===== 太阳（发光 + 光晕精灵）=====
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd36e })
    )
    scene.add(sun)

    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = glowCanvas.height = 256
    const gctx = glowCanvas.getContext('2d')
    const grad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(255,214,120,1)')
    grad.addColorStop(0.25, 'rgba(255,170,60,0.55)')
    grad.addColorStop(0.6, 'rgba(255,120,30,0.14)')
    grad.addColorStop(1, 'rgba(255,90,0,0)')
    gctx.fillStyle = grad
    gctx.fillRect(0, 0, 256, 256)
    const glowTex = new THREE.CanvasTexture(glowCanvas)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false }))
    glow.scale.set(22, 22, 1)
    scene.add(glow)

    // ===== 行星 =====
    const planetObjs = []
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    planets.forEach((p, i) => {
      const group = new THREE.Group()

      // 轨道环
      const orbitPts = []
      for (let a = 0; a <= 128; a++) {
        const ang = (a / 128) * Math.PI * 2
        orbitPts.push(new THREE.Vector3(Math.cos(ang) * p.dist, 0, Math.sin(ang) * p.dist))
      }
      const orbit = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitPts),
        new THREE.LineBasicMaterial({ color: 0x3d5aab, transparent: true, opacity: 0.32 })
      )
      scene.add(orbit)

      // 行星本体（程序化贴图，零外部资源）
      const tex = makePlanetTexture(p.color, i)
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.85,
        metalness: 0.08,
        emissive: new THREE.Color(p.color).multiplyScalar(0.18),
      })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 40, 40), mat)
      mesh.userData = { id: p.id, name: p.name, fact: p.fact, baseScale: 1 }
      group.add(mesh)

      // 土星光环
      if (p.id === 'saturn') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(p.radius * 1.45, p.radius * 2.25, 96),
          new THREE.MeshBasicMaterial({
            color: 0xe8dcae,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
          })
        )
        ring.rotation.x = Math.PI / 2.35
        group.add(ring)
      }

      // 选中光环
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(p.radius * 1.35, p.radius * 1.55, 64),
        new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 0, side: THREE.DoubleSide })
      )
      halo.rotation.x = Math.PI / 2
      group.add(halo)

      scene.add(group)
      planetObjs.push({ data: p, group, mesh, halo, angle: Math.random() * Math.PI * 2, speed: 0.42 / Math.sqrt(p.dist) })
    })

    // ===== 相机控制（鼠标/触摸拖拽 + 滚轮）=====
    let dragging = false
    let lastX = 0
    let lastY = 0
    let clickStart = 0

    const dom = renderer.domElement
    const onDown = (e) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      clickStart = performance.now()
    }
    const onMove = (e) => {
      pointer.x = (e.clientX / mount.clientWidth) * 2 - 1
      pointer.y = -(e.clientY / mount.clientHeight) * 2 + 1
      if (!dragging) return
      camState.theta -= (e.clientX - lastX) * 0.006
      camState.phi = Math.min(1.52, Math.max(0.18, camState.phi - (e.clientY - lastY) * 0.005))
      lastX = e.clientX
      lastY = e.clientY
    }
    const onUp = () => {
      dragging = false
    }
    const onWheel = (e) => {
      e.preventDefault()
      camState.radius = Math.min(90, Math.max(20, camState.radius + e.deltaY * 0.03))
    }
    const onClick = (e) => {
      if (performance.now() - clickStart > 450) return // 拖拽不算点击
      handlePick(e)
    }

    // ===== 点击拾取 =====
    function handlePick(e) {
      const rect = mount.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(planetObjs.map((o) => o.mesh), false)
      if (!hits.length) return
      const hit = hits[0].object
      const g = useGame.getState()
      if (g.phase !== 'play' || g.level !== 0) return
      if (g.collected.includes(hit.userData.id)) {
        beep('fail', g.sound)
        g.resetCombo()
        g.setToast?.('已经收录过啦，换一颗试试')
        setToastLocal('已经收录过啦，换一颗试试')
        return
      }
      g.collect(hit.userData.id)
      g.addScore(50, `收集 ${hit.userData.name}`)
      beep('ok', g.sound)
      setToastLocal(`${hit.userData.name}：${hit.userData.fact}`)
      speak(hit.userData.name + '。' + hit.userData.fact, { enabled: g.sound })
      const obj = planetObjs.find((o) => o.mesh === hit)
      if (obj) obj.pop = 1.9
    }

    let setToastLocal = () => {}
    // 由外部注入 toast（避免循环依赖）
    stateRef.current.setToast = (fn) => (setToastLocal = fn)

    dom.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    dom.addEventListener('wheel', onWheel, { passive: false })
    dom.addEventListener('click', onClick)

    // ===== 响应式 =====
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    // ===== 渲染循环 =====
    let raf = 0
    let t = 0
    const clock = new THREE.Clock()

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 0.05)
      t += dt

      sun.rotation.y += dt * 0.12
      glow.scale.setScalar(22 + Math.sin(t * 1.6) * 0.6)
      stars.rotation.y += dt * 0.008

      planetObjs.forEach((o) => {
        o.angle += o.speed * dt * 1.6
        const x = Math.cos(o.angle) * o.data.dist
        const z = Math.sin(o.angle) * o.data.dist
        o.group.position.set(x, Math.sin(o.angle * 2 + o.data.dist) * 0.25, z)
        o.mesh.rotation.y += dt * 0.5

        // 收集后变亮 + 弹出动画
        const g = useGame.getState()
        const got = g.collected?.includes(o.data.id)
        o.mesh.material.emissive.setStyle(o.data.color)
        o.mesh.material.emissiveIntensity = got ? 0.55 : 0.12
        o.halo.material.opacity += ((got ? 0.85 : 0) - o.halo.material.opacity) * 0.15
        o.halo.lookAt(camera.position)

        if (o.pop) {
          o.pop = Math.max(1, o.pop - dt * 4)
          o.group.scale.setScalar(o.pop)
        } else {
          o.group.scale.setScalar(1)
        }
      })

      // 相机
      const r = camState.radius
      const desired = new THREE.Vector3(
        r * Math.sin(camState.phi) * Math.cos(camState.theta),
        r * Math.cos(camState.phi),
        r * Math.sin(camState.phi) * Math.sin(camState.theta)
      )
      camera.position.lerp(desired, 0.11)
      camera.lookAt(camState.target)

      // ===== 立体渲染 =====
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (mode === 'parallax') {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        // 视差模式：相机随鼠标轻微偏移（伪 6DoF，性能最好）
        camera.position.x += pointer.x * 0.9
        camera.position.y += pointer.y * 0.6
        renderer.setViewport(0, 0, w, h)
        renderer.render(scene, camera)
        camera.position.x -= pointer.x * 0.9
        camera.position.y -= pointer.y * 0.6
      } else if (mode === 'headtrack') {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        // 头部追踪降级为"更强视差"（若开启摄像头追踪则在外部注入 offset）
        const hx = pointer.x * 2.4
        const hy = pointer.y * 1.6
        camera.position.x += hx
        camera.position.y += hy
        renderer.setViewport(0, 0, w, h)
        renderer.render(scene, camera)
        camera.position.x -= hx
        camera.position.y -= hy
      } else {
        // SBS / 红蓝：双相机立体
        stereo.aspect = w / 2 / h
        stereo.eyeSep = mode === 'anaglyph' ? 0.04 : 0.07
        camera.aspect = w / 2 / h
        camera.updateProjectionMatrix()
        stereo.update(camera)
        renderer.autoClear = false
        const half = Math.floor(w / 2)
        renderer.setScissorTest(true)
        renderer.setViewport(0, 0, half, h)
        renderer.setScissor(0, 0, half, h)
        renderer.clear()
        renderer.render(scene, stereo.cameraL)
        renderer.setViewport(half, 0, half, h)
        renderer.setScissor(half, 0, half, h)
        renderer.render(scene, stereo.cameraR)
        renderer.setScissorTest(false)
        renderer.setViewport(0, 0, w, h)
        renderer.autoClear = true
      }
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      dom.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      dom.removeEventListener('wheel', onWheel)
      dom.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => {
            if (m.map) m.map.dispose()
            m.dispose()
          })
        }
      })
    }
  }, [mode])

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
}

// 程序化行星贴图（噪点 + 色带），零外部资源、体积为 0
function makePlanetTexture(baseColor, seed) {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const base = new THREE.Color(baseColor)
  ctx.fillStyle = `#${base.getHexString()}`
  ctx.fillRect(0, 0, size, size)

  // 色带
  for (let i = 0; i < 26; i++) {
    const y = Math.random() * size
    const hgt = 2 + Math.random() * 12
    const l = base.clone()
    l.offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.28)
    ctx.fillStyle = `#${l.getHexString()}`
    ctx.globalAlpha = 0.16 + Math.random() * 0.22
    ctx.fillRect(0, y, size, hgt)
  }
  // 斑块
  ctx.globalAlpha = 0.12
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 2 + Math.random() * 16
    const l = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.35)
    ctx.fillStyle = `#${l.getHexString()}`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
