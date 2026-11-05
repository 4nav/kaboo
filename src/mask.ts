import { Point } from '@react-three/drei'
import * as THREE from 'three'
import { context } from 'three/tsl'

export const MASKW = 2048
export const MASKH = 1024

export type Mask = {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    texture: THREE.CanvasTexture
}

export type Point = {x:number, y:number}

export function createMask(): Mask {
    const canvas = document.createElement('canvas')
    canvas.width = MASKW
    canvas.height = MASKH
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0,0,MASKW, MASKH)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return {canvas, ctx, texture}
}

export function clear(m: Mask){
    m.ctx.fillStyle = '#000'
    m.ctx.fillRect(0,0,MASKW,MASKH)
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