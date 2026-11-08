import {MASKW, MASKH, snapshot, type Mask} from './mask'

type Face = (ctx: CanvasRenderingContext2D) => void

function poly(ctx: CanvasRenderingContext2D, pts: [number, number][]){
    ctx.beginPath()
    pts.forEach(([x,y], i) => (i?ctx.lineTo(x,y): ctx.moveTo(x,y)))
    ctx.closePath()
    ctx.fill()
}

const FACES: Record<string,Face> = {
    classic: (ctx) => {
        poly(ctx, [[-190, -40], [-70, -40], [-130, -150]]) // eyes
        poly(ctx, [[70, -40], [190, -40], [130, -150]])
        poly(ctx, [[0, -10], [-35, 50], [35, 50]]) // nose
        ctx.beginPath() // jagged grin
        ctx.moveTo(-200, 100)
        for (let i = 1; i <= 8; i++) ctx.lineTo(-200 + i * 50, i % 2 ? 140 : 100)
        ctx.quadraticCurveTo(0, 290, -200, 100)
        ctx.closePath()
        ctx.fill()
    },
    happy: (ctx) => {
        for (const x of [-110, 110]) {
        ctx.beginPath()
        ctx.arc(x, -60, 55, 0, Math.PI * 2)
        ctx.fill()
        }
        ctx.lineWidth = 45
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(0, 20, 170, 0.15 * Math.PI, 0.85 * Math.PI)
        ctx.stroke()
    },
    spooky: (ctx) => {
        poly(ctx, [[-200, -120], [-50, -60], [-170, -40]]) // angry slanted eyes
        poly(ctx, [[200, -120], [50, -60], [170, -40]])
        poly(ctx, [[0, -10], [-25, 35], [25, 35]]) // small nose
        poly(ctx, [
        [-220, 70], [220, 70], [200, 120], [150, 100], [120, 190],
        [90, 100], [-90, 100], [-120, 190], [-150, 100], [-200, 120],
        ]) // wide mouth with fangs
    },
    surprised: (ctx) => {
        for (const x of [-100, 100]) {
        ctx.beginPath()
        ctx.ellipse(x, -60, 45, 70, 0, 0, Math.PI * 2)
        ctx.fill()
        }
        ctx.beginPath()
        ctx.ellipse(0, 110, 60, 85, 0, 0, Math.PI * 2)
        ctx.fill()
    },
}

export const NAMES = Object.keys(FACES)

export function facingU(camX: number, camZ: number){
    const phi = Math.atan2(camZ, -camX)
    const u = phi / (2 * Math.PI)
    return u < 0 ? u + 1 : u
}

export function stampFace(m: Mask, name: string, u: number, scale: number){
    snapshot(m)
    const {ctx} = m
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#fff'
    const cx = u*MASKW
    const cy = MASKH * 0.48
    for(const dx of [-MASKW, 0, MASKW]){
        ctx.save()
        ctx.translate(cx + dx, cy)
        ctx.scale(scale, scale)
        FACES[name](ctx)
        ctx.restore()
    }   
    m.texture.needsUpdate = true
}