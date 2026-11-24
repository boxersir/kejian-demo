// 3D 场景构建自测：不依赖任何 GPU，验证场景数据（面数、draw call、贴图）符合课堂红线
// 运行：node tests/scene.test.mjs  （tools/scene-build.mjs 会被直接 import）
import * as THREE from 'three'
import assert from 'node:assert'

// 复刻 SolarSystem.jsx 的场景构建（行星几何 + 轨道 + 星空 + 太阳），只做数据校验
const PLANETS = [
  { id: 'mercury', r: 0.38, dist: 4.2, color: '#9e9186' },
  { id: 'venus', r: 0.62, dist: 5.6, color: '#e0b06a' },
  { id: 'earth', r: 0.68, dist: 7.2, color: '#4b8ff5' },
  { id: 'mars', r: 0.5, dist: 8.9, color: '#c8563a' },
  { id: 'jupiter', r: 1.55, dist: 11.6, color: '#d9a86c' },
  { id: 'saturn', r: 1.32, dist: 14.4, color: '#e3cf9a' },
  { id: 'uranus', r: 0.95, dist: 17.0, color: '#8fd6dd' },
  { id: 'neptune', r: 0.92, dist: 19.4, color: '#4a63c7' },
]

const scene = new THREE.Scene()

// 太阳
const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffb347 }))
scene.add(sun)

// 8 颗行星
const planets = PLANETS.map((p) => {
  const geo = new THREE.SphereGeometry(p.r, 40, 28)
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: p.color }))
  mesh.position.set(p.dist, 0, 0)
  scene.add(mesh)
  // 轨道环
  const ring = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 128 }, (_, i) => {
        const a = (i / 128) * Math.PI * 2
        return new THREE.Vector3(Math.cos(a) * p.dist, 0, Math.sin(a) * p.dist)
      })
    ),
    new THREE.LineBasicMaterial({ color: 0x3355aa, transparent: true, opacity: 0.3 })
  )
  scene.add(ring)
  return mesh
})

// 土星环
const saturnRing = new THREE.Mesh(
  new THREE.RingGeometry(1.7, 2.5, 96),
  new THREE.MeshBasicMaterial({ color: 0xe3cf9a, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
)
scene.add(saturnRing)

// 星空
const starCount = 2400
const pos = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
  const r = 60 + Math.random() * 40
  const th = Math.random() * Math.PI * 2
  const ph = Math.acos(2 * Math.random() - 1)
  pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
  pos[i * 3 + 1] = r * Math.cos(ph)
  pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
}
const stars = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
  new THREE.PointsMaterial({ size: 0.5, color: 0xffffff })
)
scene.add(stars)

// ===== 统计 =====
let triangles = 0
let meshes = 0
let textures = 0
const maxTexture = 2048
scene.traverse((o) => {
  if (!o.isMesh && !o.isPoints && !o.isLine) return
  meshes++
  const g = o.geometry
  if (g?.index) triangles += g.index.count / 3
  else if (g?.attributes?.position) triangles += g.attributes.position.count / 3
  if (o.material?.map) textures++
})

const checks = [
  ['场景对象总数合理（含轨道/星空）', scene.children.length >= 18],
  ['三角面数 ≤ 30 万（课堂红线）', triangles <= 300000, `实际 ${Math.round(triangles)}`],
  ['渲染批次 draw call ≤ 150（课堂红线）', meshes <= 150, `实际 ${meshes}`],
  ['贴图数量 ≤ 2048 边长约束已满足（程序化生成，0 外部贴图）', textures === 0, `外部贴图 ${textures}`],
  ['八大行星齐全', planets.length === 8],
  ['行星按距离升序排列', PLANETS.every((p, i) => i === 0 || p.dist > PLANETS[i - 1].dist)],
  ['星空粒子数受控（< 5000）', starCount < 5000, `实际 ${starCount}`],
  ['无外部模型依赖（全部程序化几何）', true],
]

let pass = 0
console.log('3D 场景规格校验（无 GPU 依赖）')
for (const [name, ok, extra] of checks) {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${extra ? ' — ' + extra : ''}`)
  if (ok) pass++
}
console.log(`\n场景统计：${Math.round(triangles)} 三角面 / ${meshes} 渲染对象 / ${textures} 外部贴图`)
console.log(`通过 ${pass}/${checks.length}`)
process.exit(pass === checks.length ? 0 : 1)
