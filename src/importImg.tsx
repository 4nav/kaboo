import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from 'three'
import {MASKW, MASKH, snapshot, saveMask, type Mask} from './mask'
import { useThree } from '@react-three/fiber'
import { facingU } from './presets'
import { isTyping, useUI } from './store'


type Mode = 'dark' | 'light' 
type Overlay = { img?: HTMLImageElement; ready?: HTMLCanvasElement; cx: number; cy: number }

function makeImgCanvas(img: HTMLImageElement, mode: Mode, threshold: number){
    const s = Math.min(1, 1024 / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * s))
    const h = Math.max(1, Math.round(img.height * s))
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d', {willReadFrequently: true})!
    ctx.drawImage(img, 0, 0, w, h)
    const d = ctx.getImageData(0,0,w,h)
    for(let i = 0; i < d.data.length; i+=4){
        const r= d.data[i]
        const g = d.data[i + 1]
        const b = d.data[i + 2]
        const a = d.data[i + 3] / 255
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        let carve = 0
        if (mode === 'dark')carve = lum < threshold ? a : 0
        else carve = lum > threshold ? a: 0
        d.data[i] = d.data[i+1] = d.data[i + 2] = 255
        d.data[i + 3] = Math.round(carve*255)
    }
    ctx.putImageData(d,0,0)
    return c
}

function makeShapeCanvas(kind:string){
    const w = 512
    const h = kind === 'rectangle' ? 320: 512
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    if(kind === 'circle')ctx.ellipse(w/2, h/2, w/2, h/2, 0,0,Math.PI * 2)
    else if(kind === 'triangle'){
        ctx.moveTo(w/2,0)
        ctx.lineTo(w,h)
        ctx.lineTo(0,h)
        ctx.closePath()
    } else if(kind === 'star'){
        for(let i = 0; i < 10; ++i){
            const r = (i%2 ? 0.4:1) * (w/2)
            const a = -Math.PI / 2 + i * Math.PI / 5
            const x = w/2 + r * Math.cos(a), y = h/2 + r * Math.sin(a)
            if(i)ctx.lineTo(x,y)
            else ctx.moveTo(x,y)
        }
        ctx.closePath()
    } else ctx.rect(0,0,w,h)
    ctx.fill()
    return c
} 

function draw(m: Mask, imgCanvas: HTMLCanvasElement, cx: number, cy:number, width: number, rotDeg: number){
    const h = width * (imgCanvas.height / imgCanvas.width)
    const lat = Math.max(0.25, Math.sin((Math.PI * cy)/ MASKH))

    for (const dx of [-MASKW,0,MASKW]){
        m.ctx.save()
        m.ctx.translate(cx + dx, cy)
        m.ctx.scale(1/lat, 1)
        m.ctx.rotate((rotDeg * Math.PI) / 180)
        m.ctx.drawImage(imgCanvas, -width/2, -h/2, width, h)
        m.ctx.restore()
    }
    m.texture.needsUpdate = true
}

function pickImg(onImg: (img: HTMLImageElement) => void){
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
        const file = input.files?.[0]
        if(!file)return
        const img = new Image()
        img.onload = () => onImg(img)
        img.src = URL.createObjectURL(file)
    }
    input.click()
}

export function useImg(mask: Mask) {
  const [img, setImg] = useState<Overlay | null>(null)
  const activeRef = useRef(false)
  const baseRef = useRef<ImageData | null>(null)
  const placing = useRef(false)
  activeRef.current = img !== null
 
  const mode = useUI((s) => s.imgMode)
  const threshold = useUI((s) => s.imgThreshold)
  const size = useUI((s) => s.stampSize)
  const rotation = useUI((s) => s.stampRotation)
  const get = useThree((s) => s.get)
 
  const cancel = useCallback(() => {
    if (baseRef.current) {
      mask.ctx.putImageData(baseRef.current, 0, 0)
      mask.texture.needsUpdate = true
      mask.undoStack.pop()
    }
    baseRef.current = null
    placing.current = false
    setImg(null)
  }, [mask])
 
  const apply = useCallback(() => {
    if (!baseRef.current) return
    baseRef.current = null
    placing.current = false
    setImg(null)
    saveMask(mask)
  }, [mask])
 
  const startAt = useCallback(
    (overlay: Omit<Overlay, 'cx' | 'cy'>) => {
      if (baseRef.current) cancel()
      snapshot(mask)
      baseRef.current = mask.undoStack[mask.undoStack.length - 1]

      const { camera } = get()
      useUI.getState().update({ stampRotation: 0, menu: null })
      setImg({ ...overlay, cx: facingU(camera.position.x, camera.position.z) * MASKW,  cy: MASKH * 0.5, })
    }, [mask, cancel, get])
 
  const importImage = useCallback(() => pickImg((image) => startAt({ img: image })), [startAt])
  const beginShape = useCallback((kind: string) => startAt({ ready: makeShapeCanvas(kind) }), [startAt])
 
  const imgActions = useMemo(
    () => ({ importImage, beginShape, apply, cancel }),
    [importImage, beginShape, apply, cancel]
  )
 
  const kind = img ? (img.ready ? 'shape' : 'image') : null
  useEffect(() => {
    useUI.getState().update({ stamping: kind })
  }, [kind])
 
  const imgCanvas = useMemo(() => (!img ? null : img.ready ?? makeImgCanvas(img.img!, mode, threshold)),
    [img?.img, img?.ready, mode, threshold]
  )
 
  useEffect(() => {
    if (!img || !imgCanvas || !baseRef.current) return
    mask.ctx.putImageData(baseRef.current, 0, 0)
    draw(mask, imgCanvas, img.cx, img.cy, size, rotation)
  }, [img, imgCanvas, size, rotation, mask])
 
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!activeRef.current) return
      if (!(e.target instanceof HTMLCanvasElement)) return 
      e.preventDefault()
      e.stopPropagation() 

      const st = useUI.getState()
      const f = e.deltaY < 0 ? 1.08 : 0.92
      st.update({ stampSize: Math.min(2048, Math.max(40, st.stampSize * f)) })
    }
    const onKey = (e: KeyboardEvent) => {
      if (!activeRef.current || isTyping(e)) return

      const k = e.key.toLowerCase()
      if (k === 'enter') return apply()
      if (k === 'escape') return cancel()
        
      let r = useUI.getState().stampRotation
      if (k === 'q') r -= 5
      else if (k === 'e') r += 5
      else return

      if (r > 180) r -= 360
      if (r < -180) r += 360
      useUI.getState().update({ stampRotation: r })
    }
    window.addEventListener('wheel', onWheel, { capture: true, passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true })
      window.removeEventListener('keydown', onKey)
    }
  }, [apply, cancel])
 
  const place = useCallback((uv: THREE.Vector2) => { setImg((s) => (s ? { ...s, cx: uv.x * MASKW, cy: (1 - uv.y) * MASKH } : s))}, [])
 
  const onDown = useCallback((uv: THREE.Vector2) => {
      placing.current = true
      place(uv)
    },[place]
  )
 
  const onMove = useCallback((uv: THREE.Vector2) => {
      if (placing.current) place(uv)
    }, [place]
  )
 
  const onUp = useCallback(() => {
    placing.current = false
  }, [])
 
  return { activeRef, onDown, onMove, onUp, imgActions }
}