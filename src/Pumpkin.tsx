import { useEffect, useMemo, useRef } from 'react'
import * as THREE from "three"
import { button, useControls } from "leva"
import { MASKH, MASKW, clear, createMask, paint, download, downloadStencil, redo, undo, snapshot, load, saveMask, type Point } from './mask'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useImg } from './importImg'
import { NAMES, facingU, stampFace } from './presets'

const Z_AXIS = new THREE.Vector3(0, 0, 1)
const tmpNormal = new THREE.Vector3()

type Shape = {
  ribs: number
  ribDepth: number
  squash: number
  flatness: number
  top: number
}

function loadShape() : Partial<Shape>{
    try{
        return JSON.parse(localStorage.getItem('kaboo-shape') ?? '{}')
    }
    catch{
        return {}
    }
}

function makePumpkin({ribs, ribDepth, squash, flatness, top} : Shape){
    const g = new THREE.SphereGeometry(1,128,96)
    const pos = g.attributes.position
    const v = new THREE.Vector3()

    for(let i = 0; i < pos.count; ++i){
        v.fromBufferAttribute(pos, i)
        const angle = Math.atan2(v.z, v.x)
        const ring  = Math.sqrt(v.x * v.x + v.z * v.z)
        const lobe = Math.sqrt(Math.abs(Math.cos((angle * ribs) / 2)))
        const rib = 1 - ribDepth * (1 - lobe) * ring
        v.x *= rib
        v.z *= rib
        v.y = Math.sign(v.y) * Math.pow(Math.abs(v.y), flatness) * squash
        if(v.y > 0)v.y -= (top * Math.exp(-ring * ring * 10))
            pos.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
}

const LIGHTS: Record<string, { light: string; glow: string }> = {
    candle: { light: '#ffa040', glow: '#ff8a1f' },
    fire: { light: '#ff6a1a', glow: '#ff4a00' },
    green: { light: '#6dff6a', glow: '#22ff44' },
    'ghost blue': { light: '#6ab8ff', glow: '#2a7bff' },
    purple: { light: '#b56aff', glow: '#8a2bff' },
    red: { light: '#ff4040', glow: '#ff1a1a' },
    white: { light: '#fff4e0', glow: '#ffe9b0' },
}

function flicker(kind: string, t:number){
    switch(kind){
        case 'steady': return 1
        case 'fire': return 0.85 + 0.25 * Math.sin(t * 7) * Math.sin(t * 3.1) + 0.12 * Math.sin(t*19 + 2)
        case 'pulse': return 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.4))
        case 'faulty': {
            const base = 1 + 0.08 * Math.sin(t*9) + 0.05 * Math.sin(t*23 + 1.3) 
            return Math.sin(t * 3.7) * Math.sin(t * 13) > 0.8 ? base * 0.25 : base
        }
        default: return 1 + 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23 + 1.3)
    }
}

export default function Pumpkin() {
    const saved = useRef(loadShape()).current
    const mask = useMemo(createMask, [])
    const alpha = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = MASKW
        canvas.height = MASKH
        return {canvas, ctx:canvas.getContext('2d')!, texture: new THREE.CanvasTexture(canvas)}
    }, [])
    const soft = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = MASKW
        canvas.height = MASKH
        return {canvas, ctx: canvas.getContext('2d')!, texture: new THREE.CanvasTexture(canvas)}
    }, [])
    const seenSoft = useRef(-1)
    const lastSoft = useRef(0)
    const seenVersion = useRef(-1)
    const lightRef = useRef<THREE.PointLight>(null)
    const { activeRef, onDown, onMove, onUp } = useImg(mask)
    const get = useThree((s) => s.get)
    const brush = useControls('Brush', {
        size: {value: 30, min: 4, max: 120, step: 1},
        erase: false,
    })
    const shape = useControls('Pumpkin', {
        ribs: {value: saved.ribs ?? 14, min: 6, max: 20, step: 1},
        ribDepth: {value:saved.ribDepth?? 0.05, min: 0, max: 0.15, step: 0.005},
        squash: {value: saved.squash ?? 0.80, min: 0.5, max: 1, step: 0.01},
        flatness: {value: saved.flatness??1, min: 1, max: 2, step: 0.01},
        top: {value: saved.top??0.06, min: 0, max: 0.3, step: 0.01},
    })
    const light = useControls('Lighting', {
        on: {value: true, label: 'internal light'},
        color: {value: 'candle', options: Object.keys(LIGHTS)},
        flicker: {value: 'candle', options: ['steady', 'candle', 'fire', 'pulse', 'faulty']},
        brightness: { value: 1, min: 0.2, max: 3, step: 0.05 },
        height: { value: -0.4, min: -0.8, max: 0.6, step: 0.05 },
    })


    useControls('Actions', {
        'undo (ctrl+z)': button(() => {
            if(activeRef.current)return
            undo(mask)
            saveMask(mask)
        }),

        'redo (ctrl+y)': button(() => {
            if(activeRef.current)return
            redo(mask)
            saveMask(mask)
        }),

        clear: button(() => {
            clear(mask)
            saveMask(mask)
        }),

        'export stencil': button(() => downloadStencil(mask)),
        'export render': button(() => {
            const {gl, scene, camera} = get()
            gl.render(scene, camera)
            download(gl.domElement.toDataURL('image/png'), 'kaboo-render.png')
        }),
    })

    const faceScaleRef = useRef(1)
    const {faceSize} = useControls('Faces', {
        faceSize: {value: 1, min: 0.5, max: 1.6, step: 0.05, label: 'size'}, ...Object.fromEntries(
            NAMES.map((name:string) => [
                name,
                button(() => {
                    if(activeRef.current)return
                    const {camera} = get()
                    stampFace(mask,name, facingU(camera.position.x, camera.position.z), faceScaleRef.current)
                    saveMask(mask)
                })
            ])
        ),
    })
    faceScaleRef.current = faceSize

    const controls = useThree((s) => s.controls)as any

    const setLeftRotate = (on: boolean) => {
        if(controls)controls.mouseButtons.LEFT = on? THREE.MOUSE.ROTATE: -1
    }
    useEffect(() => {
        if(controls)controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
    }, [controls])

    useEffect(() => load(mask), [mask])
    useEffect(() => {
        localStorage.setItem('kaboo-shape', JSON.stringify(shape))
    }, [shape.ribs, shape.ribDepth, shape.squash, shape.flatness, shape.top])

    const drawing = useRef(false)
    const hovering = useRef(false)
    const last = useRef<Point | null>(null)
    const matRef = useRef<THREE.MeshStandardMaterial>(null)
    const ringRef = useRef<THREE.Mesh>(null)
    const ringMatRef = useRef<THREE.MeshBasicMaterial>(null)

    const moveCursor = (e: ThreeEvent<PointerEvent>) => {
        const ring = ringRef.current
        if(!ring || !e.face)return
        ring.visible = !activeRef.current
        tmpNormal.copy(e.face.normal)
        ring.position.copy(e.point).addScaledVector(tmpNormal, 0.004)
        ring.quaternion.setFromUnitVectors(Z_AXIS, tmpNormal)
    }

    useEffect(() => {
        const up = () => {
            onUp()
            if(drawing.current)saveMask(mask)
            drawing.current = false
            last.current = null
            if(controls)controls.mouseButtons.LEFT = hovering.current ? -1 : THREE.MOUSE.ROTATE
        }
        window.addEventListener('pointerup', up)
        return () => window.removeEventListener('pointerup', up)
    }, [controls, mask, onUp])

    useFrame(({ clock }) => {
        if(mask.texture.version !== seenVersion.current){
            seenVersion.current = mask.texture.version
            const {ctx} = alpha
            ctx.globalCompositeOperation = 'source-over'
            ctx.drawImage(mask.canvas, 0,0)
            ctx.globalCompositeOperation = 'difference'
            ctx.fillStyle = '#fff'
            ctx.fillRect(0,0,MASKW, MASKH)
            ctx.globalCompositeOperation = 'source-over'
            alpha.texture.needsUpdate = true
        }
        const now = performance.now()
        if(seenSoft.current !== mask.texture.version && now - lastSoft.current > 120){
            seenSoft.current = mask.texture.version
            lastSoft.current = now
            soft.ctx.globalCompositeOperation = 'copy'
            soft.ctx.filter = 'blur(2px)'
            soft.ctx.drawImage(alpha.canvas, 0,0)
            soft.ctx.filter = 'none'
            soft.texture.needsUpdate = true
        }
        const f = flicker(light.flicker, clock.elapsedTime)
        if (matRef.current) matRef.current.emissiveIntensity = light.on ? 0.7 * f * light.brightness : 0
        if(lightRef.current)lightRef.current.intensity = light.on ? 3*f*light.brightness : 0
        if(ringRef.current)ringRef.current.scale.setScalar(brush.size * 2 * Math.PI/MASKW)
        if(ringMatRef.current)ringMatRef.current.color.set(brush.erase ? '#ff5a5a' : "#ffffff") 
    })

    useEffect(() => {
        const onKey = (e:KeyboardEvent) => {
            if(activeRef.current)return
            if((e.target as HTMLElement).tagName === 'INPUT')return
            if(!(e.ctrlKey || e.metaKey))return
            const k = e.key.toLowerCase()
            if (k === 'z' && !e.shiftKey) undo(mask)
            else if(k === 'y')redo(mask)
            else return
            e.preventDefault()
            saveMask(mask)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [mask])

    const geometry = useMemo( () => makePumpkin(shape), [shape.ribs, shape.ribDepth, shape.squash, shape.flatness, shape.top])

    return (
        <>
        <group position = {[0, -0.85 + shape.squash, 0]}>
            <mesh 
            geometry={geometry} 
            castShadow
             onPointerDown={(e) => {
                if (e.button !== 0) return
                e.stopPropagation()
                if(activeRef.current) { if (e.uv) onDown(e.uv); return}
                drawing.current = true
                snapshot(mask)
                last.current = null
                if(e.uv)last.current = paint(mask, e.uv,last.current,brush.size,brush.erase )
             }}
            onPointerMove={(e) => {
                moveCursor(e)
                if(activeRef.current){if (e.uv) onMove(e.uv); return}
                if(drawing.current && e.uv)last.current = paint(mask, e.uv,last.current,brush.size,brush.erase )
            }}
            onPointerOver={(e) => {
                hovering.current = true
                setLeftRotate(false)
                moveCursor(e)
            }}

            onPointerOut={() => {
                hovering.current = false
                if(ringRef.current)ringRef.current.visible = false
                if (!drawing.current) setLeftRotate(true)
            }}
            >
            <meshStandardMaterial color="#e8731a" roughness={0.6} alphaMap={alpha.texture} alphaTest={0.5} bumpMap={soft.texture} bumpScale={0.035} />
            </mesh>
               <mesh position={[0, shape.squash - shape.top + 0.13, 0]} rotation={[0, 0, 0.15]}>
                <cylinderGeometry args={[0.08, 0.13, 0.3, 12]} />
                <meshStandardMaterial color="#4a3320" roughness={0.9} />
            </mesh>
            {/* hollow interior, lit from a "candle" near the bottom so the wall has a gradient */}
            <mesh geometry={geometry} scale={0.93} raycast={() => null}>
            <meshStandardMaterial ref={matRef} side={THREE.BackSide} color="#7a2e08"
                roughness={1} emissive={LIGHTS[light.color].glow} emissiveIntensity={0.7} />
        </mesh>
        <pointLight ref={lightRef} position={[0, -0.4, 0]} color={LIGHTS[light.color].light} intensity={3} distance={5} />
        </group>

        <mesh ref={ringRef} visible={false} raycast={() => null}>
            <ringGeometry args={[0.47, 0.5, 48]}/>
            <meshBasicMaterial ref={ringMatRef} color="#ffffff" side={THREE.DoubleSide}
                transparent opacity={0.9} depthWrite={false} toneMapped={false} />
        </mesh>
        </>
    )
}