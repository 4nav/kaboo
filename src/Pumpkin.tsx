import { useEffect, useMemo, useRef } from 'react'
import * as THREE from "three"
import { button, useControls } from "leva"
import { clear, createMask, paint, download, downloadStencil, redo, undo, snapshot, load, saveMask, type Point } from './mask'
import { useFrame, useThree } from '@react-three/fiber'
import { useImg } from './importImg'

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

export default function Pumpkin() {
    const saved = useRef(loadShape()).current
    const mask = useMemo(createMask, [])
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

    const controls = useThree((s) => s.controls)as any

    const setLeftRotate = (on: boolean) => {
        if(controls)controls.mouseButtons.LEFT = on? THREE.MOUSE.ROTATE: -1
    }
    useEffect(() => {
        if(controls)controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
    })

    useEffect(() => load(mask), [mask])
    useEffect(() => {
        localStorage.setItem('kaboo-shape', JSON.stringify(shape))
    }, [shape.ribs, shape.ribDepth, shape.squash, shape.flatness, shape.top])

    const drawing = useRef(false)
    const hovering = useRef(false)
    const last = useRef<Point | null>(null)
    const matRef = useRef<THREE.MeshStandardMaterial>(null)

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
        const t = clock.elapsedTime
        const f = 1 + 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23 + 1.3)
        if (matRef.current) matRef.current.emissiveIntensity = 2 * f
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
                if(activeRef.current){if (e.uv) onMove(e.uv); return}
                if(drawing.current && e.uv)last.current = paint(mask, e.uv,null,brush.size,brush.erase )
            }}
            onPointerOver={() => {
                hovering.current = true
                setLeftRotate(false)
            }}

            onPointerOut={() => {
                hovering.current = false
                if (!drawing.current) setLeftRotate(true)
            }}
            >
            <meshStandardMaterial ref= {matRef} color="#e8731a" roughness={0.6} emissive='#ffb347' emissiveMap={mask.texture} emissiveIntensity={2} />
            </mesh>
            <mesh position={[0, shape.squash - shape.top + 0.13, 0]} rotation={[0, 0, 0.15]}>
                <cylinderGeometry args={[0.08,0.13,0.3,12]}/>
                <meshStandardMaterial color="#4a3320" roughness={0.9}/>
            </mesh>
        </group>
    )
}