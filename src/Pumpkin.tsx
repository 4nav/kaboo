import { useEffect, useMemo, useRef } from 'react'
import * as THREE from "three"
import { button, useControls } from "leva"
import { clear, createMask, paint, type Point } from './mask'
import { useFrame, useThree } from '@react-three/fiber'



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
    const shape = useControls('Pumpkin', {
        ribs: {value: 12, min: 6, max: 20, step: 1},
        ribDepth: {value: 0.06, min: 0, max: 0.15, step: 0.005},
        squash: {value: 0.75, min: 0.5, max: 1, step: 0.01},
        flatness: {value: 1.3, min: 1, max: 2, step: 0.01},
        top: {value: 0.1, min: 0, max: 0.3, step: 0.01},
    })

    const mask = useMemo(createMask, [])
    const brush = useControls('Brush', {
        size: {value: 30, min: 4, max: 120, step: 1},
        erase: false,
        clear: button(() => clear(mask))
    })

    const controls = useThree((s) => s.controls)as any
    const setRotate = (on: boolean) => {
        if(controls)controls.enableRotate = on
    }

    const drawing = useRef(false)
    const hovering = useRef(false)
    const last = useRef<Point | null>(null)
    const matRef = useRef<THREE.MeshStandardMaterial>(null)

    useEffect(() => {
        const up = () => {
            drawing.current = false
            last.current = null
            if(controls)controls.enableRotate = !hovering.current
        }
        window.addEventListener('pointerup', up)
        return () => window.removeEventListener('pointerup', up)
    }, [controls])

    useFrame(({clock}) => {
        const t= clock.elapsedTime
        const f = 1 + 0.08 * Math.sin(t*9) + 0.05 * Math.sin(t * 23 + 1.3)
        if(matRef.current)matRef.current.emissiveIntensity = 2*f
    })

    const geometry = useMemo( () => makePumpkin(shape), [shape.ribs, shape.ribDepth, shape.squash, shape.flatness, shape.top])

    return (
        <group position = {[0, -0.85 + shape.squash, 0]}>
            <mesh 
            geometry={geometry} 
            castShadow
             onPointerDown={(e) => {
                e.stopPropagation()
                drawing.current = true
                last.current = null
                if(e.uv)last.current = paint(mask, e.uv,null,brush.size,brush.erase )
             }}
            onPointerMove={(e) => {
                if(drawing.current && e.uv)last.current = paint(mask, e.uv,null,brush.size,brush.erase )
            }}
            onPointerOver={() => {
                hovering.current = true
                setRotate(false)
            }}

            onPointerOut={() => {
                hovering.current = false
                if (!drawing.current) setRotate(true)
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