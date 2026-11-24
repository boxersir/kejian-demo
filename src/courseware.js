// 课件 DSL v0.1 —— 场景即数据，渲染器负责解释执行
// 一个"世界" = 若干关卡；每关 = 目标 + 交互 + 题 + 奖励

export const world = {
  id: 'solar-system',
  title: '太阳系的秘密',
  subject: '小学科学 · 六年级上册《地球与宇宙》',
  cover: '#0b1533',
  levels: [
    {
      id: 'L1',
      name: '第 1 关 · 认识八大行星',
      type: 'inspect', // 观察探索型
      goal: '依次点击全部 8 颗行星，完成行星图鉴。',
      intro: '小小航天员，你已登上空间站。请转动视角，依次点选 8 颗行星，把它们收进图鉴。',
      hint: '提示：水星离太阳最近，海王星最远。',
      score: 400,
    },
    {
      id: 'L2',
      name: '第 2 关 · 行星离太阳有多远',
      type: 'sort', // 排序型
      goal: '把 4 颗行星按"由近到远"拖入轨道卡槽。',
      intro: '太阳能装下 130 万个地球。现在请把水星、地球、木星、海王星，按离太阳由近到远排好队。',
      hint: '提示：水 < 地 < 木 < 海。',
      score: 500,
    },
    {
      id: 'L3',
      name: '第 3 关 · 为什么有四季',
      type: 'quiz', // 选择型
      goal: '回答 2 道题，全部答对即可通关。',
      intro: '地球倾斜着身子绕太阳公转，于是有了四季。请回答下面两题。',
      hint: '提示：地轴倾角约 23.5°。',
      score: 600,
    },
  ],
}

// 行星数据（真实相对数值，用于渲染与题目）
export const planets = [
  { id: 'mercury', name: '水星', radius: 0.28, dist: 5.2, color: '#b7b1a8', orbit: 2.4, fact: '离太阳最近，白天 430℃，夜里 -180℃。' },
  { id: 'venus', name: '金星', radius: 0.42, dist: 7.2, color: '#e8c27a', orbit: 3.9, fact: '表面 460℃，是太阳系最热的行星。' },
  { id: 'earth', name: '地球', radius: 0.46, dist: 9.6, color: '#3d9be9', orbit: 5.6, fact: '目前唯一已知有生命的星球。' },
  { id: 'mars', name: '火星', radius: 0.32, dist: 12.0, color: '#c1502e', orbit: 7.4, fact: '有太阳系最高的山——奥林帕斯山，约 21 千米。' },
  { id: 'jupiter', name: '木星', radius: 1.15, dist: 17.5, color: '#d8a878', orbit: 10.2, fact: '体积最大，能装下 1300 个地球。' },
  { id: 'saturn', name: '土星', radius: 0.98, dist: 22.5, color: '#e3d3a1', orbit: 12.6, fact: '美丽的光环由无数冰块和岩石组成。' },
  { id: 'uranus', name: '天王星', radius: 0.7, dist: 27.0, color: '#8fd6e0', orbit: 14.8, fact: '侧躺着自转，像滚动的球。' },
  { id: 'neptune', name: '海王星', radius: 0.68, dist: 31.0, color: '#4a6cf7', orbit: 17.0, fact: '风速可达 2000 千米/小时，太阳系风最猛。' },
]

export const quizBank = [
  {
    id: 'q1',
    q: '地球绕太阳公转一周大约需要多久？',
    options: ['24 小时', '一个月', '365 天', '10 年'],
    answer: 2,
    why: '地球公转一周约 365 天，这就是一年。24 小时是自转周期。',
  },
  {
    id: 'q2',
    q: '四季形成的主要原因是？',
    options: ['地球离太阳忽远忽近', '地轴倾斜，太阳照射角度变化', '太阳自己变亮变暗', '月亮挡住阳光'],
    answer: 1,
    why: '地轴倾斜约 23.5°，公转时太阳直射点南北移动，形成四季。',
  },
]

// TTS 讲解词（发布时由 piper 离线合成 mp3，前端零等待；本 Demo 用浏览器 SpeechSynthesis 兜底）
export const narration = {
  L1: '小小航天员，欢迎登上空间站。转动视角，依次点选八颗行星，把它们收进你的图鉴。',
  L1_done: '太棒了！八颗行星全部收录，你的图鉴完成了。',
  L2: '现在，请把四颗行星按离太阳由近到远，拖进下面的轨道卡槽。',
  L2_done: '完全正确！离太阳最近的是水星，最远的是海王星。',
  L3: '地球倾斜着身子绕太阳公转，于是有了四季。请回答两道题。',
  L3_done: '恭喜通关！你已经是太阳系小专家了。',
}
