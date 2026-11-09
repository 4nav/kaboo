import { useEffect, useMemo, useRef } from 'react'
import * as THREE from "three"
import { MASKH, MASKW, clear, createMask, paint, download, downloadStencil, redo, undo, snapshot, load, saveMask, type Point } from './mask'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useImg } from './importImg'
import { facingU, stampFace } from './presets'
import { LIGHTS, flicker } from './lights'
import { isTyping, useUI } from './store'


const Z_AXIS = new THREE.Vector3(0, 0, 1)
const tmpNormal = new THREE.Vector3()
const ui = () => useUI.getState() 

type Shape = {
  ribs: number
  ribDepth: number
  squash: number
  flatness: number
  top: number
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

export default function Pumpkin() {
    const s = useUI()
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
    const { activeRef, onDown, onMove, onUp, imgActions } = useImg(mask)
    const get = useThree((s) => s.get)

    useEffect(()=> {
        useUI.getState().setActions({
            undo: () => {
                if(activeRef.current)return
                undo(mask)
                saveMask(mask)
            },
            redo: () => {
                if (activeRef.current) return
                redo(mask)
                saveMask(mask)
            },
            clear: () => {
                if (activeRef.current) return
                clear(mask)
                saveMask(mask)
            },
            exportStencil: () => downloadStencil(mask),
            exportRender: () => {
                const { gl } = get() 
                download(gl.domElement.toDataURL('image/png'), 'kaboo-render.png')
            },
            stampFace: (name: string) => {
                if (activeRef.current) return
                const { camera } = get()
                stampFace(mask, name, facingU(camera.position.x, camera.position.z), ui().faceSize)
                saveMask(mask)
            },
            ...imgActions,
        })
    }, [mask,get,activeRef, imgActions])


    const controls = useThree((s) => s.controls)as any

    useEffect(() => {
        if(!controls)return
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
        controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
        controls.touches.ONE = s.touchMode === 'paint' ? -1 : THREE.TOUCH.ROTATE
        controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE
    }, [controls, s.touchMode])

    const setLeftRotate = (on: boolean) => {
        if(controls)controls.mouseButtons.LEFT = on? THREE.MOUSE.ROTATE: -1
    }

    useEffect(() => load(mask), [mask])

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
            if(controls)controls.mouseButtons.LEFT = hovering.current  && ui().touchMode === 'paint' ? -1 : THREE.MOUSE.ROTATE
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
        const f = flicker(ui().flicker, clock.elapsedTime)
        if (matRef.current) matRef.current.emissiveIntensity = ui().lightOn ? 0.7 * f * ui().brightness : 0
        if(lightRef.current)lightRef.current.intensity = ui().lightOn ? 3*f*ui().brightness : 0
        if(ringRef.current)ringRef.current.scale.setScalar((ui().brushSize * 2 * Math.PI)/MASKW)
        if (ringMatRef.current) ringMatRef.current.color.set(ui().tool === 'eraser' ? '#ff5a5a' : '#ffffff')    
    })

    useEffect(() => {
        const onKey = (e:KeyboardEvent) => {
            if(activeRef.current || isTyping(e))return
            if((e.target as HTMLElement).tagName === 'INPUT')return
            if(!(e.ctrlKey || e.metaKey))return
            const k = e.key.toLowerCase()
            if (k === 'z' && !e.shiftKey) ui().actions.undo()
            else if(k === 'y')ui().actions.redo()
            else return
            e.preventDefault()
            saveMask(mask)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [mask])

    const geometry = useMemo( () => makePumpkin({ribs: s.ribs, ribDepth: s.ribDepth, squash: s.squash, flatness: s.flatness, top: s.top}), 
    [s.ribs, s.ribDepth, s.squash, s.flatness, s.top])

    const L = LIGHTS[s.lightColor] ?? LIGHTS.candle

    return (
        <>
        <group position = {[0, -0.85 + s.squash, 0]}>
            <mesh 
            geometry={geometry} 
            castShadow
             onPointerDown={(e) => {
                if (e.button !== 0) return
                if (ui().touchMode !== 'paint') return
                e.stopPropagation()
                if(activeRef.current) { if (e.uv) onDown(e.uv); return}
                drawing.current = true
                snapshot(mask)
                last.current = null
                const { brushSize, tool } = ui()
                if(e.uv)last.current = paint(mask, e.uv,null,brushSize,tool === 'eraser' )
             }}
            onPointerMove={(e) => {
                moveCursor(e)
                if(activeRef.current){if (e.uv) onMove(e.uv); return}
                if(drawing.current && e.uv){
                    const { brushSize, tool } = ui()
                    last.current = paint(mask, e.uv,last.current,brushSize,tool === 'eraser' )
                }
            }}
            onPointerOver={(e) => {
                hovering.current = true
                if (ui().touchMode === 'paint') setLeftRotate(false)
                moveCursor(e)
            }}

            onPointerOut={() => {
                hovering.current = false
                if(ringRef.current)ringRef.current.visible = false
                if (!drawing.current) setLeftRotate(true)
            }}
            >
            <meshStandardMaterial color={s.color} roughness={0.6} alphaMap={alpha.texture} alphaTest={0.5} bumpMap={soft.texture} bumpScale={0.035} />
            </mesh>
               <mesh position={[0, s.squash - s.top - 0.02 + s.stemHeight/2, 0]} rotation={[0, 0, s.stemTilt]}>
                <cylinderGeometry args={[0.08 * s.stemWidth, 0.13 * s.stemWidth, s.stemHeight, 12]} />
                <meshStandardMaterial color={s.stemColor} roughness={0.9} />
            </mesh>

            {/* hollow interior, lit from a "candle" near the bottom so the wall has a gradient */}
            <mesh geometry={geometry} scale={0.93} raycast={() => null}>
            <meshStandardMaterial ref={matRef} side={THREE.BackSide} color="#7a2e08"
                roughness={1} emissive={L.glow} emissiveIntensity={0.7} />
        </mesh>
        <pointLight ref={lightRef} position={[0, s.lightHeight, 0]} color={L.light} intensity={3} distance={5} />
        </group>

        <mesh ref={ringRef} visible={false} raycast={() => null}>
            <ringGeometry args={[0.47, 0.5, 48]}/>
            <meshBasicMaterial ref={ringMatRef} color="#ffffff" side={THREE.DoubleSide}
                transparent opacity={0.9} depthWrite={false} toneMapped={false} />
        </mesh>
        </>
    )
}