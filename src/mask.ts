import * as THREE from 'three'

export const MASKW = 2048
export const MASKH = 1024
const MAX_HISTORY = 15 
const MASK_KEY = 'kaboo-mask'

export type Mask = {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    texture: THREE.CanvasTexture
    undoStack: ImageData[]
    redoStack: ImageData[]

}

export type Point = {x:number, y:number}
export type Shape = 'circle' | 'rectangle' | 'triangle'

export function createMask(): Mask {
    const canvas = document.createElement('canvas')
    canvas.width = MASKW
    canvas.height = MASKH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0,0,MASKW, MASKH)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return {canvas, ctx, texture, undoStack: [], redoStack: []}
}

export function snapshot(m: Mask){
    m.undoStack.push(m.ctx.getImageData(0,0,MASKW,MASKH))
    if(m.undoStack.length > MAX_HISTORY)m.undoStack.shift()
    m.redoStack.length = 0
}

function restore(m: Mask, img: ImageData){
    m.ctx.putImageData(img,0,0)
    m.texture.needsUpdate = true
}

export function undo(m: Mask){
    const prev = m.undoStack.pop()
    if(!prev)return
    m.redoStack.push(m.ctx.getImageData(0,0,MASKW, MASKH))
    restore(m,prev)
}

export function redo(m: Mask){
    const prev = m.redoStack.pop()
    if(!prev)return
    m.undoStack.push(m.ctx.getImageData(0,0,MASKW, MASKH))
    restore(m,prev)
}

export function clear(m: Mask){
    snapshot(m)
    m.ctx.fillStyle = "#000"
    m.ctx.fillRect(0, 0, MASKW, MASKH)
    m.texture.needsUpdate = true
}

export function paint(m: Mask, uv: THREE.Vector2, last: Point | null, size: number, erase: boolean): Point{
    const {ctx, texture} = m
    const x = uv.x * MASKW
    const y = (1 - uv.y) * MASKH
    const color = erase? "#000":"#fff"
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.beginPath()

    if(last && Math.abs(x - last.x) < MASKW/2){
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(x,y)
        ctx.stroke()
    } else{
        ctx.arc(x,y,size / 2, 0 , Math.PI * 2)
        ctx.fill()
    }
    texture.needsUpdate = true
    return {x,y}
}

export function saveMask(m: Mask){
    try{
        localStorage.setItem(MASK_KEY, m.canvas.toDataURL('image/png'))
    }
    catch{

    }
}

export function load(m: Mask){
    const data = localStorage.getItem(MASK_KEY)
    if(!data)return
    const img = new Image()
    img.onload = () => {
        m.ctx.drawImage(img, 0, 0)
        m.texture.needsUpdate = true
    }
    img.src = data
}

export function download(url: string, filename: string){
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
}

export function downloadStencil(m: Mask){ //like irl printout idk if this works
    const c = document.createElement('canvas')
    c.width = MASKW
    c.height = MASKH
    const ctx = c.getContext('2d')!
    ctx.drawImage(m.canvas, 0, 0)
    ctx.globalCompositeOperation = 'difference'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0,0,MASKW,MASKH)
    download(c.toDataURL('image/png'), 'kaboo-stencil.png')
}

