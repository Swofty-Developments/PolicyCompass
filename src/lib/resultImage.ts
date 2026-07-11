// Draw the standing as a shareable PNG on a canvas — no external deps.

export interface ResultImageData {
  archetype: string
  overallRead: string
  axes: { name: string; mean: number }[]
  topLeader?: string
  topParty?: string
  ratified: number
  struck: number
  abstained: number
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function renderResultCanvas(data: ResultImageData): HTMLCanvasElement {
  const W = 1200
  const H = 630
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!

  // desk backdrop
  ctx.fillStyle = '#1a130d'
  ctx.fillRect(0, 0, W, H)

  // parchment sheet
  const m = 36
  const g = ctx.createLinearGradient(0, m, 0, H - m)
  g.addColorStop(0, '#f6ebd0')
  g.addColorStop(1, '#e0cd9f')
  ctx.fillStyle = g
  roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 16)
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#b59b6a'
  ctx.stroke()

  const cx = W / 2
  // kicker
  ctx.textAlign = 'center'
  ctx.fillStyle = '#9e2b25'
  ctx.font = '700 20px "Courier New", monospace'
  ctx.fillText('P O L I C Y   C O M P A S S', cx, 96)

  ctx.fillStyle = '#7a5c2e'
  ctx.font = '16px "Courier New", monospace'
  ctx.fillText('THE FLOOR FINDS YOU', cx, 134)

  // archetype
  ctx.fillStyle = '#221a10'
  ctx.font = '700 58px Georgia, serif'
  ctx.fillText(data.archetype, cx, 196)

  ctx.fillStyle = '#5e4a28'
  ctx.font = 'italic 22px Georgia, serif'
  ctx.fillText(data.overallRead, cx, 230)

  // axis bars
  const barX = 150
  const barW = W - 2 * barX
  const top = 280
  const rowH = 50
  ctx.textAlign = 'left'
  data.axes.forEach((a, i) => {
    const y = top + i * rowH
    ctx.fillStyle = '#9e2b25'
    ctx.font = '700 14px "Courier New", monospace'
    ctx.fillText(a.name.toUpperCase(), barX, y - 8)

    // track gradient communist -> fascist
    const tg = ctx.createLinearGradient(barX, 0, barX + barW, 0)
    tg.addColorStop(0, '#9e2b25')
    tg.addColorStop(0.38, '#caa64a')
    tg.addColorStop(0.5, '#cbb789')
    tg.addColorStop(0.62, '#5a8f5f')
    tg.addColorStop(1, '#3a2d6b')
    ctx.fillStyle = tg
    roundRect(ctx, barX, y, barW, 12, 6)
    ctx.fill()

    // pin
    const px = barX + ((a.mean + 1) / 2) * barW
    ctx.beginPath()
    ctx.arc(px, y + 6, 9, 0, Math.PI * 2)
    ctx.fillStyle = '#f3e7c9'
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#221a10'
    ctx.stroke()
  })

  // footer line
  ctx.textAlign = 'center'
  ctx.fillStyle = '#3c6b2f'
  ctx.font = '600 20px Georgia, serif'
  const echo = data.topLeader ? `Echoes ${data.topLeader}` : ''
  const tally =
    `Ratified ${data.ratified} · Struck ${data.struck}` +
    (data.abstained > 0 ? ` · Abstained ${data.abstained}` : '')
  ctx.fillText([echo, tally].filter(Boolean).join('     ·     '), cx, H - 70)

  ctx.fillStyle = '#7a5c2e'
  ctx.font = '15px "Courier New", monospace'
  ctx.fillText('FIND YOUR STANDING — SWIPE THE DOCKET', cx, H - 44)

  return c
}

export function downloadResultImage(data: ResultImageData, filename = 'policy-compass.png') {
  const canvas = renderResultCanvas(data)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
}
