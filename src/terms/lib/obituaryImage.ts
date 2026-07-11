// Draw the obituary as a shareable PNG on a canvas — dossier language, no deps.
import { AXIS_IDS } from '../../types'
import { axisMeta } from '../../engine/axes'
import type { Obituary } from '../types'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function renderObituaryCanvas(obit: Obituary): HTMLCanvasElement {
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

  // the wax stamp, tilted in the corner
  const stampText = obit.ending.stamp
  ctx.save()
  ctx.translate(W - 190, 108)
  ctx.rotate(-0.13)
  ctx.font = '700 24px "Courier New", monospace'
  const tw = ctx.measureText(stampText).width
  ctx.strokeStyle = '#9e2b25'
  ctx.lineWidth = 4
  ctx.globalAlpha = 0.85
  roundRect(ctx, -tw / 2 - 16, -26, tw + 32, 52, 6)
  ctx.stroke()
  ctx.fillStyle = '#9e2b25'
  ctx.textAlign = 'center'
  ctx.fillText(stampText, 0, 9)
  if (obit.ending.cutShort) {
    ctx.font = '700 14px "Courier New", monospace'
    ctx.fillText('CUT SHORT', 0, 44)
  }
  ctx.restore()

  const cx = W / 2
  ctx.textAlign = 'center'
  ctx.fillStyle = '#9e2b25'
  ctx.font = '700 20px "Courier New", monospace'
  ctx.fillText('T E R M S  ·  O B I T U A R Y', cx, 96)

  ctx.fillStyle = '#7a5c2e'
  ctx.font = '16px "Courier New", monospace'
  ctx.fillText('THE REPUBLIC REMEMBERS', cx, 134)

  // archetype + epitaph
  ctx.fillStyle = '#221a10'
  ctx.font = '700 54px Georgia, serif'
  ctx.fillText(obit.archetypeTitle, cx, 196)

  ctx.fillStyle = '#5e4a28'
  ctx.font = 'italic 22px Georgia, serif'
  const epitaph = obit.epitaph.length > 96 ? obit.epitaph.slice(0, 95) + '…' : obit.epitaph
  ctx.fillText(`“${epitaph}”`, cx, 232)

  // axis bars
  const barX = 150
  const barW = W - 2 * barX
  const top = 286
  const rowH = 50
  ctx.textAlign = 'left'
  AXIS_IDS.forEach((axis, i) => {
    const y = top + i * rowH
    ctx.fillStyle = '#9e2b25'
    ctx.font = '700 14px "Courier New", monospace'
    ctx.fillText(axisMeta(axis).name.toUpperCase(), barX, y - 8)

    const tg = ctx.createLinearGradient(barX, 0, barX + barW, 0)
    tg.addColorStop(0, '#9e2b25')
    tg.addColorStop(0.38, '#caa64a')
    tg.addColorStop(0.5, '#cbb789')
    tg.addColorStop(0.62, '#5a8f5f')
    tg.addColorStop(1, '#3a2d6b')
    ctx.fillStyle = tg
    roundRect(ctx, barX, y, barW, 12, 6)
    ctx.fill()

    const mean = obit.axisMeans[axis] ?? 0
    const px = barX + ((Math.max(-1, Math.min(1, mean)) + 1) / 2) * barW
    ctx.beginPath()
    ctx.arc(px, y + 6, 9, 0, Math.PI * 2)
    ctx.fillStyle = '#f3e7c9'
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#221a10'
    ctx.stroke()
  })

  // brag footer
  ctx.textAlign = 'center'
  ctx.fillStyle = '#3c6b2f'
  ctx.font = '600 19px Georgia, serif'
  const b = obit.brag
  ctx.fillText(
    `Terms ${b.termsServed}  ·  Winning side ${b.winningSide}  ·  Promises ${b.promisesKept} kept / ${b.promisesBroken} broken  ·  Scandals survived ${b.scandalsSurvived}`,
    cx,
    H - 70,
  )

  ctx.fillStyle = '#7a5c2e'
  ctx.font = '15px "Courier New", monospace'
  ctx.fillText('TAKE OFFICE — POLICY COMPASS · TERMS', cx, H - 44)

  return c
}

export function downloadObituaryImage(obit: Obituary, filename = 'terms-obituary.png') {
  const canvas = renderObituaryCanvas(obit)
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
